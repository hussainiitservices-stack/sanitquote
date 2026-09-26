export const queryKeys = {
  session: ["session"] as const,
  merchants: {
    all: ["merchants"] as const,
    detail: (id: string) => ["merchants", id] as const,
  },
  companies: {
    all: ["companies"] as const,
    detail: (id: string) => ["companies", id] as const,
  },
  products: {
    all: ["products"] as const,
    byCompany: (companyId: string) => ["products", { companyId }] as const,
  },
  access: {
    byMerchant: (merchantId: string) => ["access", merchantId] as const,
  },
  clients: {
    all: ["clients"] as const,
    detail: (id: string) => ["clients", id] as const,
  },
  quotations: {
    all: ["quotations"] as const,
    detail: (id: string) => ["quotations", id] as const,
  },
}
