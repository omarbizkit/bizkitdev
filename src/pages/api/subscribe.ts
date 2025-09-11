import type { APIRoute } from 'astro';
import type { SubscribeRequest, SubscribeResponse, ErrorResponse } from '../../types/api';
import { supabase } from '../../lib/supabase';
import { isValidEmail, generateSecureToken, generateUUID, sanitizeInput } from '../../utils/crypto';

// Enable server-side rendering for API routes
export const prerender = false;

/**
 * POST /api/subscribe
 * Creates a new subscription with email confirmation
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body: SubscribeRequest;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON'
        } as ErrorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Validate email field exists
    if (!body.email) {
      return new Response(
        JSON.stringify({
          error: 'MISSING_EMAIL',
          message: 'Email field is required'
        } as ErrorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Sanitize and validate email
    const email = sanitizeInput(body.email.toLowerCase().trim());
    
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        } as ErrorResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Check if email is already subscribed
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('id, email, confirmed')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking existing subscriber:', checkError);
      return new Response(
        JSON.stringify({
          error: 'DATABASE_ERROR',
          message: 'Unable to process subscription at this time'
        } as ErrorResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    if (existingSubscriber) {
      if (existingSubscriber.confirmed) {
        return new Response(
          JSON.stringify({
            error: 'ALREADY_SUBSCRIBED',
            message: 'This email address is already subscribed'
          } as ErrorResponse),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      } else {
        // Resend confirmation for unconfirmed subscriber
        const newConfirmationToken = generateSecureToken();
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            confirmation_token: newConfirmationToken,
            created_at: new Date().toISOString(),
            email_sent: false
          })
          .eq('id', existingSubscriber.id);

        if (updateError) {
          console.error('Error updating subscriber:', updateError);
          return new Response(
            JSON.stringify({
              error: 'DATABASE_ERROR',
              message: 'Unable to process subscription at this time'
            } as ErrorResponse),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            }
          );
        }

        // TODO: Send confirmation email with newConfirmationToken
        // For now, we'll just return success

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Please check your email to confirm your subscription',
            subscriber_id: existingSubscriber.id
          } as SubscribeResponse),
          {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      }
    }

    // Create new subscription
    const subscriberId = generateUUID();
    const confirmationToken = generateSecureToken();
    const unsubscribeToken = generateSecureToken();

    const { data: newSubscriber, error: insertError } = await supabase
      .from('subscribers')
      .insert({
        id: subscriberId,
        email: email,
        confirmed: false,
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
        created_at: new Date().toISOString(),
        email_sent: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subscriber:', insertError);
      
      // Handle unique constraint violation (email already exists)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'ALREADY_SUBSCRIBED',
            message: 'This email address is already subscribed'
          } as ErrorResponse),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'DATABASE_ERROR',
          message: 'Unable to create subscription at this time'
        } as ErrorResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // TODO: Send confirmation email
    // Email sending will be implemented when email service is configured

    // Update email_sent status
    await supabase
      .from('subscribers')
      .update({ email_sent: true })
      .eq('id', subscriberId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Please check your email to confirm your subscription',
        subscriber_id: subscriberId
      } as SubscribeResponse),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Error in /api/subscribe:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'An internal server error occurred'
      } as ErrorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};

// Reject non-POST methods
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed for this endpoint'
    } as ErrorResponse),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST, OPTIONS'
      }
    }
  );
};

export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;