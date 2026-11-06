import type { Access, CollectionConfig, FieldAccess } from 'payload'

const isAdmin = (user: { collection?: string } | null | undefined) => user?.collection === 'admins'

const isAdminOrSelf: Access = ({ req }) => {
  if (isAdmin(req.user)) return true
  if (req.user?.collection === 'users') {
    return { id: { equals: req.user.id } }
  }
  return false
}

const adminsOnlyField: FieldAccess = ({ req }) => isAdmin(req.user)

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'LocalConvert',
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
  },
  access: {
    create: () => true,
    delete: ({ req }) => isAdmin(req.user),
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      maxLength: 80,
    },
    {
      name: 'plan',
      type: 'select',
      defaultValue: 'free',
      required: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
      ],
      access: {
        create: adminsOnlyField,
        update: adminsOnlyField,
      },
    },
  ],
}
