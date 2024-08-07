import { invariantResponse } from '@epic-web/invariant'
import { getKindeSession } from '@kinde-oss/kinde-remix-sdk'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { cache } from '#app/utils/cache.server.ts'
import {
	getAllInstances,
	getInstanceInfo,
	ensureInstance,
} from '#app/utils/litefs.server.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	// await requireUserWithRole(request, 'admin')
	// TODO: Copy above encapsulate below code to function
	// Also, this permission. Change requiredRole to requiredPermission
	const { getPermission } = await getKindeSession(request)
	const user = await getPermission('administrator')
	const roleName = 'admin'
	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredRole: roleName,
				message: `Unauthorized: required role: ${roleName}`,
			},
			{ status: 403 },
		)
	}
	const searchParams = new URL(request.url).searchParams
	const currentInstanceInfo = await getInstanceInfo()
	const allInstances = await getAllInstances()
	const instance =
		searchParams.get('instance') ?? currentInstanceInfo.currentInstance
	await ensureInstance(instance)

	const { cacheKey } = params
	invariantResponse(cacheKey, 'cacheKey is required')
	return json({
		instance: {
			hostname: instance,
			region: allInstances[instance],
			isPrimary: currentInstanceInfo.primaryInstance === instance,
		},
		cacheKey,
		value: cache.get(cacheKey),
	})
}
