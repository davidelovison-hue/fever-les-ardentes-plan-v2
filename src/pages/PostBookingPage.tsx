import { useLayoutEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { isOrderConfirmationState, isPostBookingState } from '../lib/checkoutState'
import { readCheckoutBasket } from '../lib/checkoutFlowStorage'
import { persistOrderConfirmation } from '../lib/orderConfirmStorage'
import { planPath, orderConfirmationPath } from '../lib/routes'
import { persistLastOrderEventId } from '../lib/userSession'

/** Legacy route: post-booking form removed — forward to confirmation. */
export function PostBookingPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const raw = location.state as unknown
  const fromRouter =
    eventId &&
    (isOrderConfirmationState(raw) || isPostBookingState(raw)) &&
    (raw as { eventId: string }).eventId === eventId
      ? raw
      : null
  const fromBasket = eventId ? readCheckoutBasket(eventId) : null
  const data =
    fromRouter ??
    (fromBasket &&
    (isOrderConfirmationState(fromBasket) || isPostBookingState(fromBasket)) &&
    fromBasket.eventId === eventId
      ? fromBasket
      : null)

  useLayoutEffect(() => {
    if (!eventId || !data || !isOrderConfirmationState(data)) return
    persistOrderConfirmation(data)
    persistLastOrderEventId(eventId)
    navigate(orderConfirmationPath(eventId), { replace: true, state: data })
  }, [data, eventId, navigate])

  if (!eventId || !data || !isOrderConfirmationState(data)) {
    return <Navigate to={eventId ? planPath('tickets') : '/'} replace />
  }

  return null
}
