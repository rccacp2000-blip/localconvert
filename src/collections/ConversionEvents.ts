import type { Access, CollectionConfig, PayloadRequest } from 'payload'

const isAdmin = (user: { collection?: string } | null | undefined) => user?.collection === 'admins'

const readOwnEvents: Access = ({ req }) => {
  if (isAdmin(req.user)) return true
  if (req.user?.collection === 'users') {
    return { owner: { equals: req.user.id } }
  }
  return false
}

export const ConversionEvents: CollectionConfig = {
  slug: 'conversion-events',
  admin: {
    group: 'LocalConvert',
    defaultColumns: ['operation', 'inputBytes', 'success', 'createdAt'],
    useAsTitle: 'operation',
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => isAdmin(req.user),
    read: readOwnEvents,
    update: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user?.collection === 'users') {
          return { ...data, owner: req.user.id }
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
      name: 'operation',
      type: 'select',
      required: true,
      options: [
        { label: 'Uppercase', value: 'uppercase' },
        { label: 'Lowercase', value: 'lowercase' },
        { label: 'Format JSON', value: 'json' },
        { label: 'Clean lines', value: 'lines' },
      ],
    },
    {
      name: 'inputBytes',
      type: 'number',
      min: 0,
      required: true,
      validate: (value: number | null | undefined, { req }: { req: PayloadRequest }) => {
        if (typeof value !== 'number') return 'Input size is required.'
        if (req.user?.collection !== 'users') return 'A user account is required.'
        const plan = 'plan' in req.user ? req.user.plan : 'free'
        const limit = plan === 'pro' ? 2 * 1024 * 1024 * 1024 : 25 * 1024 * 1024
        return (
          value <= limit ||
          `This conversion exceeds the ${plan === 'pro' ? '2 GB' : '25 MB'} plan limit.`
        )
      },
    },
    {
      name: 'outputBytes',
      type: 'number',
      min: 0,
      max: 2 * 1024 * 1024 * 1024,
      required: true,
    },
    {
      name: 'success',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
  ],
  timestamps: true,
}
