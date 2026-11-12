// A fresh checkout runs offline; only an explicit opt-out enables Rails.
export const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'
