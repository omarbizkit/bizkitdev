import { supabase } from '../lib/supabase'

export interface SubscriptionResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Subscribe a user to the email list
 */
export async function subscribeUser(email: string): Promise<SubscriptionResult> {
  try {
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address.',
        error: 'Invalid email format'
      }
    }

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('email, confirmed, active')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new subscribers
      throw checkError
    }

    if (existingSubscriber) {
      if (existingSubscriber.active && existingSubscriber.confirmed) {
        return {
          success: false,
          message: 'This email is already subscribed to our updates.',
          error: 'Already subscribed'
        }
      } else if (existingSubscriber.active && !existingSubscriber.confirmed) {
        return {
          success: false,
          message: 'Please check your email and confirm your subscription.',
          error: 'Pending confirmation'
        }
      } else {
        // Reactivate inactive subscription
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({ active: true, confirmed: false })
          .eq('email', email)

        if (updateError) throw updateError

        return {
          success: true,
          message: 'Welcome back! Please check your email to confirm your subscription.'
        }
      }
    }

    // Insert new subscriber
    const { error: insertError } = await supabase.from('subscribers').insert({
      email,
      confirmed: false,
      active: true
    })

    if (insertError) throw insertError

    return {
      success: true,
      message: 'Thank you for subscribing! Please check your email to confirm your subscription.'
    }
  } catch (error) {
    console.error('Subscription error:', error)
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Confirm a user's email subscription
 */
export async function confirmSubscription(email: string): Promise<SubscriptionResult> {
  try {
    const { error } = await supabase.rpc('confirm_subscription', {
      subscription_email: email
    })

    if (error) throw error

    return {
      success: true,
      message: 'Your subscription has been confirmed! Thank you for joining our community.'
    }
  } catch (error) {
    console.error('Confirmation error:', error)
    return {
      success: false,
      message: 'Unable to confirm subscription. The link may be invalid or expired.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Unsubscribe a user from the email list
 */
export async function unsubscribeUser(email: string): Promise<SubscriptionResult> {
  try {
    const { error } = await supabase.rpc('unsubscribe_email', {
      subscription_email: email
    })

    if (error) throw error

    return {
      success: true,
      message: 'You have been successfully unsubscribed from our email list.'
    }
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return {
      success: false,
      message: 'Unable to unsubscribe. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the total count of active subscribers (for analytics)
 */
export async function getActiveSubscribersCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('active_subscribers_count')
      .select('total_subscribers')
      .single()

    if (error) throw error

    return data?.total_subscribers || 0
  } catch (error) {
    console.error('Error getting subscriber count:', error)
    return 0
  }
}
