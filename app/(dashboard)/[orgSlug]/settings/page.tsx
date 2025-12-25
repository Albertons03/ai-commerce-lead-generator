import { redirect } from 'next/navigation'

export default function SettingsPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  // Redirect to general settings by default
  redirect(`/${params.orgSlug}/settings/general`)
}
