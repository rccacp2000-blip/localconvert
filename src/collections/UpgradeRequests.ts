import type { Access, CollectionConfig } from 'payload'

const isAdmin = (user: { collection?: string } | null | undefined) => user?.collection === 'admins'

const readOwnRequests: Access = ({ req }) => {
  if (isAdmin(req.user)) return true
  if (req.user?.collection === 'users') {
    return { owner: { equals: req.user.id } }
  }
  return false
}

export const UpgradeRequests: CollectionConfig = {
  slug: 'upgrade-requests',
  admin: {
    group: 'LocalConvert',
    defaultColumns: ['owner', 'status', 'createdAt'],
    useAsTitle: 'status',
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => isAdmin(req.user),
    read: readOwnRequests,
    update: ({ req }) => isAdmin(req.user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.collection === 'users') {
          return { ...data, owner: req.user.id, status: 'pending' }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Activated', value: 'activated' },
        { label: 'Declined', value: 'declined' },
      ],
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
    },
  ],
  timestamps: true,
}
