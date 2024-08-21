import { useParams } from '@remix-run/react'
import { useEffect, useState } from 'react'

export default function Alize() {
	const params = useParams()
	const [daysLeft, setDaysLeft] = useState(0)

	useEffect(() => {
		// Tenor script loading
		const script = document.createElement('script')
		script.src = 'https://tenor.com/embed.js'
		script.async = true
		document.body.appendChild(script)

		// Countdown timer logic
		const calculateDaysLeft = () => {
			const meetingDate = new Date('2024-08-29T00:00:00')
			const now = new Date()
			const difference = meetingDate.getTime() - now.getTime()
			const days = Math.ceil(difference / (1000 * 3600 * 24))
			setDaysLeft(days)
		}

		calculateDaysLeft()
		const timer = setInterval(calculateDaysLeft, 1000 * 60 * 60) // Update every hour

		return () => {
			document.body.removeChild(script)
			clearInterval(timer)
		}
	}, [])

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-200 to-purple-300 p-4">
			<div className="mb-8 rounded-lg border-2 border-pink-300 bg-pink-100 p-4 text-center shadow-md">
				<p className="text-2xl font-bold text-pink-600">
					Alizé has {daysLeft} {daysLeft === 1 ? 'day' : 'days'} to say "yes" to
					a date with Ivan
				</p>
			</div>

			<div className="mb-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
				<h2 className="mb-4 text-center text-xl font-semibold text-pink-600">
					The story goes like so...Ivan first laid eyes on Alizé and knew he had
					to ask her out 🌹
				</h2>
				<div
					className="tenor-gif-embed"
					data-postid="9525935"
					data-share-method="host"
					data-aspect-ratio="1.325"
					data-width="100%"
				></div>
			</div>

			<div className="mb-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
				<h2 className="mb-4 text-center text-xl font-semibold text-pink-600">
					The hours have turned into days, with every minute she hasn't said
					"YES!" and it's driving him insane 🫨
				</h2>
				<div
					className="tenor-gif-embed"
					data-postid="11272107"
					data-share-method="host"
					data-aspect-ratio="1.325"
					data-width="100%"
				></div>
			</div>

			<div className="mb-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
				<h2 className="mb-4 text-center text-xl font-semibold text-pink-600">
					But, with your financial support, by signing up to GoodUnionJobs, we
					can convince her that I'm a SUCCESS and we'll go Salsa 🕺💃🏻
				</h2>
				<div
					className="tenor-gif-embed"
					data-postid="19013471"
					data-share-method="host"
					data-aspect-ratio="1.325"
					data-width="100%"
				></div>
			</div>

			<div className="mb-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
				<h2 className="mb-4 text-center text-xl font-semibold text-pink-600">
					And once Alizé sees Ivan's moves she'll be back home to tell all her
					friends about it 😸
				</h2>
				<div
					className="tenor-gif-embed"
					data-postid="18614433"
					data-share-method="host"
					data-aspect-ratio="1.325"
					data-width="100%"
				></div>
				<h2 className="mb-4 text-center text-xl font-semibold text-pink-600">
					And the story will continue from there 😏...
				</h2>
			</div>
		</div>
	)
}
