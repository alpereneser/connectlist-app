import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface DatabaseNotification {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record } = (await req.json()) as { record: DatabaseNotification };

    console.log('Processing notification:', record);

    // Get the recipient's push token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('expo_push_token, username')
      .eq('id', record.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!profile?.expo_push_token) {
      console.log('No push token found for user:', record.user_id);
      return new Response(
        JSON.stringify({ message: 'No push token found for user' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get actor information from data field
    let actorProfile = null;
    if (record.data?.actor_id) {
      const { data: actor, error: actorError } = await supabaseClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', record.data.actor_id)
        .single();

      if (actorError) {
        console.error('Error fetching actor profile:', actorError);
      } else {
        actorProfile = actor;
      }
    }

    // Generate notification message based on type
    const notificationMessage = generateNotificationMessage(
      record,
      actorProfile
    );

    // Prepare notification payload
    const notificationPayload: NotificationPayload = {
      to: profile.expo_push_token,
      title: 'ConnectList',
      body: notificationMessage,
      data: {
        type: record.type,
        notificationId: record.id,
        ...record.data,
      },
    };

    // Send push notification via Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Expo push notification error:', result);
      return new Response(
        JSON.stringify({
          error: 'Failed to send push notification',
          details: result,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Push notification sent successfully:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate notification message based on type and data
function generateNotificationMessage(
  record: DatabaseNotification,
  actorProfile: any
): string {
  const actorName = actorProfile?.username || 'Birisi';
  const { type, data } = record;

  switch (type) {
    case 'like':
      return `${actorName} '${data?.listTitle || 'listeni'}' beğendi`;

    case 'comment':
      const commentText = data?.commentText || 'yorum yaptı';
      const truncatedComment =
        commentText.length > 50
          ? commentText.substring(0, 50) + '...'
          : commentText;
      return `${actorName} '${data?.listTitle || 'listene'}' yorum yaptı: "${truncatedComment}"`;

    case 'follow':
      return `${actorName} seni takip etmeye başladı`;

    case 'message':
      return `${actorName} sana mesaj gönderdi`;

    default:
      return data?.message || 'Yeni bir bildirim var';
  }
}
