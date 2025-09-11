import type { Database } from './supabase'

/**
 * Mock Supabase client for testing
 * Simulates database operations without real Supabase connection
 */

interface MockSubscriber {
  id: string
  email: string
  confirmed: boolean
  confirmation_token: string | null
  unsubscribe_token: string | null
  created_at: string
  confirmed_at: string | null
  unsubscribed_at: string | null
  email_sent: boolean
}

interface MockProject {
  id: string
  name: string
  description_short: string
  description_long: string
  status: 'idea' | 'development' | 'live' | 'archived'
  tech_stack: string[]
  subdomain_url: string
  github_url: string
  screenshot_url: string | null
  created_date: string
  featured: boolean
  updated_at: string
}

// In-memory mock data
const mockSubscribers: MockSubscriber[] = []
const mockProjects: MockProject[] = [
  {
    id: 'ai-data-insights',
    name: 'AI Data Insights Platform',
    description_short: 'Advanced analytics platform using machine learning',
    description_long: 'A comprehensive data analytics platform that leverages machine learning algorithms to provide actionable insights from complex datasets.',
    status: 'live',
    tech_stack: ['Python', 'TensorFlow', 'React', 'PostgreSQL'],
    subdomain_url: 'https://aiinsights.bizkit.dev',
    github_url: 'https://github.com/bizkitdev/ai-data-insights',
    screenshot_url: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=AI+Data+Insights',
    created_date: '2024-01-15',
    featured: true,
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'smart-dashboard',
    name: 'Smart Dashboard',
    description_short: 'Real-time business intelligence dashboard',
    description_long: 'Interactive dashboard for monitoring business KPIs with real-time data visualization and predictive analytics.',
    status: 'development',
    tech_stack: ['Vue.js', 'D3.js', 'Node.js', 'MongoDB'],
    subdomain_url: 'https://dashboard.bizkit.dev',
    github_url: 'https://github.com/bizkitdev/smart-dashboard',
    screenshot_url: null,
    created_date: '2024-02-01',
    featured: false,
    updated_at: '2024-02-01T00:00:00Z'
  }
]

// Mock Supabase client
export const mockSupabase = {
  from: (table: string) => {
    switch (table) {
      case 'subscribers':
        return createMockTable<MockSubscriber>(mockSubscribers, 'email')
      case 'projects':
        return createMockTable<MockProject>(mockProjects, 'id')
      default:
        throw new Error(`Unknown table: ${table}`)
    }
  },
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
}

function createMockTable<T extends Record<string, any>>(
  data: T[],
  uniqueField?: string
) {
  let query: Partial<T> = {}
  let selectFields: string[] = []
  let orderByField: string | null = null
  let orderAsc = true
  let limitCount: number | null = null

  return {
    select: (fields = '*') => {
      if (fields !== '*') {
        selectFields = fields.split(',').map(f => f.trim())
      }
      return {
        eq: (field: string, value: any) => {
          query[field] = value
          return createMockChain()
        },
        neq: (field: string, value: any) => {
          return createMockChain(data.filter(item => item[field] !== value))
        },
        gt: (field: string, value: any) => {
          return createMockChain(data.filter(item => item[field] > value))
        },
        gte: (field: string, value: any) => {
          return createMockChain(data.filter(item => item[field] >= value))
        },
        lt: (field: string, value: any) => {
          return createMockChain(data.filter(item => item[field] < value))
        },
        lte: (field: string, value: any) => {
          return createMockChain(data.filter(item => item[field] <= value))
        },
        like: (field: string, pattern: string) => {
          const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
          return createMockChain(data.filter(item => regex.test(item[field])))
        },
        ilike: (field: string, pattern: string) => {
          const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
          return createMockChain(data.filter(item => regex.test(item[field])))
        },
        in: (field: string, values: any[]) => {
          return createMockChain(data.filter(item => values.includes(item[field])))
        },
        order: (field: string, options: { ascending?: boolean } = {}) => {
          orderByField = field
          orderAsc = options.ascending !== false
          return createMockChain()
        },
        limit: (count: number) => {
          limitCount = count
          return createMockChain()
        },
        single: async () => {
          const filtered = applyQuery(data)
          const result = filtered.length > 0 ? filtered[0] : null
          return {
            data: result,
            error: result ? null : { code: 'PGRST116', message: 'Not found', details: 'Results contain 0 rows' }
          }
        },
        then: async (resolve: any) => {
          const filtered = applyQuery(data)
          resolve({
            data: filtered,
            error: null
          })
        }
      }
    },
    insert: (values: Partial<T> | Partial<T>[]) => {
      const items = Array.isArray(values) ? values : [values]
      const newItems = items.map(item => {
        const newItem = { ...item } as T
        // Generate ID if not provided
        if (!newItem['id' as keyof T]) {
          newItem['id' as keyof T] = Math.random().toString(36).substring(2, 15) as any
        }
        if (uniqueField && !newItem[uniqueField as keyof T]) {
          throw new Error(`Field ${uniqueField} is required`)
        }
        return newItem
      })

      data.push(...newItems)

      return {
        select: (fields = '*') => ({
          single: async () => ({
            data: newItems[0],
            error: null
          }),
          then: async (resolve: any) => {
            resolve({
              data: newItems,
              error: null
            })
          }
        })
      }
    },
    update: (values: Partial<T>) => {
      const filtered = applyQuery(data)
      filtered.forEach(item => {
        Object.assign(item, values)
      })

      return {
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: filtered.length > 0 ? filtered[0] : null,
              error: null
            }),
            then: async (resolve: any) => {
              resolve({
                data: filtered,
                error: null
              })
            }
          })
        })
      }
    },
    delete: () => {
      const filtered = applyQuery(data)
      const indicesToRemove = filtered.map(item => data.indexOf(item))
      indicesToRemove.sort((a, b) => b - a).forEach(index => {
        data.splice(index, 1)
      })

      return {
        eq: () => ({
          then: async (resolve: any) => {
            resolve({
              data: filtered,
              error: null
            })
          }
        })
      }
    }
  }

  function createMockChain(filteredData?: T[]) {
    const chain = createMockTable(filteredData || data, uniqueField)
    // Preserve query state
    chain.query = query
    chain.selectFields = selectFields
    chain.orderByField = orderByField
    chain.orderAsc = orderAsc
    chain.limitCount = limitCount
    return chain
  }

  function applyQuery(items: T[]) {
    let result = items.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        return item[key] === value
      })
    })

    if (orderByField) {
      result = result.sort((a, b) => {
        const aVal = a[orderByField]
        const bVal = b[orderByField]
        if (orderAsc) {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }

    if (limitCount) {
      result = result.slice(0, limitCount)
    }

    return result
  }
}

export default mockSupabase