import { useState, useEffect } from 'react'
import { Link, useFetcher } from '@remix-run/react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog'
import { Button } from '#app/components/ui/button'
import { Icon } from './ui/icon'
import { type JsonifyObject } from 'type-fest/source/jsonify'
import { type KindeUser } from '@kinde-oss/kinde-remix-sdk/types'

type DelayedPopupFormProps = {
	delayMs?: number
	shouldShow?: boolean
	isBot?: boolean
	user?: JsonifyObject<KindeUser> | null
}

const DelayedPopupForm = ({
	delayMs = 10_000,
	shouldShow = true,
	isBot = false,
	user = null,
}: DelayedPopupFormProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [isClient, setIsClient] = useState(false)
	const fetcher = useFetcher<{ success: boolean }>()

	useEffect(() => {
		setIsClient(true)
	}, [])

	useEffect(() => {
		if (!isClient || !shouldShow || isBot || user) return

		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => {
				const timer = setTimeout(() => {
					setIsOpen(true)
				}, delayMs)

				return () => clearTimeout(timer)
			})
		} else {
			setTimeout(() => {
				const timer = setTimeout(() => {
					setIsOpen(true)
				}, delayMs)

				return () => clearTimeout(timer)
			}, 0)
		}
	}, [delayMs, shouldShow, isClient, isBot, user])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			setIsOpen(false)
		}
	}, [fetcher.state, fetcher.data])

	if (!shouldShow || isBot || user) return null

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[425px] [&>button]:hidden">
				<DialogHeader>
					<DialogTitle>Get Job Notifications to Your Email Inbox</DialogTitle>
					<DialogDescription>
						Create an account to receive notifications for the latest union job
						opportunities that match your interests.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-4">
					<Button asChild variant="default" size="lg" className="w-full">
						<Link to="/kinde-auth/register">
							Sign Up - Get the Latest Jobs to Your Inbox
							<Icon className="ml-2 h-4 w-4" name="briefcase-business" />
						</Link>
					</Button>

					<fetcher.Form method="post" preventScrollReset>
						<Button
							type="submit"
							variant="ghost"
							size="sm"
							name="intent"
							value="closePopup"
							className="w-full"
							onClick={() => setIsOpen(false)}
							disabled={fetcher.state === 'submitting'}
						>
							{fetcher.state === 'submitting' ? 'Closing...' : 'No Thanks'}
						</Button>
					</fetcher.Form>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default DelayedPopupForm
