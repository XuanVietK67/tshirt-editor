<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IndexTable,
  IndexTableRow,
  IndexTableCell,
  Badge,
  Button,
  TextField,
  Select,
  Card,
  InlineStack,
  Text,
  Thumbnail,
  BlockStack,
  Pagination,
} from '@ownego/polaris-vue'

const router = useRouter()

interface DesignConfig {
  id: string
  name: string
  zones: number
  updatedAt: string
}

interface Product {
  id: string
  title: string
  handle: string
  imageUrl: string | null
  status: 'active' | 'draft' | 'archived'
  designConfigs: DesignConfig[]
}

const PAGE_SIZE = 5

const searchQuery = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
]

const products = ref<Product[]>([
  {
    id: 'prod_1',
    title: 'Classic Unisex T-Shirt',
    handle: 'classic-unisex-t-shirt',
    imageUrl: null,
    status: 'active',
    designConfigs: [
      { id: 'cfg_1', name: 'Front Print', zones: 2, updatedAt: '2026-03-28' },
      { id: 'cfg_2', name: 'Back Print', zones: 1, updatedAt: '2026-03-27' },
    ],
  },
  {
    id: 'prod_2',
    title: 'Premium Hoodie',
    handle: 'premium-hoodie',
    imageUrl: null,
    status: 'active',
    designConfigs: [{ id: 'cfg_3', name: 'Chest Logo', zones: 1, updatedAt: '2026-03-25' }],
  },
  {
    id: 'prod_3',
    title: 'Slim Fit Polo',
    handle: 'slim-fit-polo',
    imageUrl: null,
    status: 'draft',
    designConfigs: [],
  },
  {
    id: 'prod_4',
    title: 'Vintage Crew Neck',
    handle: 'vintage-crew-neck',
    imageUrl: null,
    status: 'active',
    designConfigs: [{ id: 'cfg_4', name: 'Full Front', zones: 3, updatedAt: '2026-03-20' }],
  },
  {
    id: 'prod_5',
    title: 'Athletic Tank Top',
    handle: 'athletic-tank-top',
    imageUrl: null,
    status: 'draft',
    designConfigs: [],
  },
  {
    id: 'prod_6',
    title: 'Long Sleeve Tee',
    handle: 'long-sleeve-tee',
    imageUrl: null,
    status: 'archived',
    designConfigs: [{ id: 'cfg_5', name: 'Sleeve Print', zones: 1, updatedAt: '2026-02-10' }],
  },
  {
    id: 'prod_7',
    title: 'Graphic Print Tee',
    handle: 'graphic-print-tee',
    imageUrl: null,
    status: 'active',
    designConfigs: [],
  },
  {
    id: 'prod_8',
    title: 'Oversized Streetwear Tee',
    handle: 'oversized-streetwear-tee',
    imageUrl: null,
    status: 'draft',
    designConfigs: [{ id: 'cfg_6', name: 'Back Graphic', zones: 2, updatedAt: '2026-03-15' }],
  },
])

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return products.value.filter((p) => {
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)
    const matchesStatus = statusFilter.value === 'all' || p.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const totalFiltered = computed(() => filteredProducts.value.length)
const totalPages = computed(() => Math.ceil(totalFiltered.value / PAGE_SIZE))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProducts.value.slice(start, start + PAGE_SIZE)
})

const tableHeadings = [
  { title: 'Product' },
  { title: 'Status' },
  { title: 'Design Configs' },
  { title: 'Actions' },
]

const totalProducts = computed(() => products.value.length)
const totalConfigs = computed(() => products.value.reduce((sum, p) => sum + p.designConfigs.length, 0))
const productsWithConfig = computed(() => products.value.filter((p) => p.designConfigs.length > 0).length)

function onSearchChange(value: string) {
  searchQuery.value = value
  currentPage.value = 1
}

function onStatusChange(value: string) {
  statusFilter.value = value
  currentPage.value = 1
}

function goToConfigDesign() {
  router.push({ name: 'config-design' })
}

function addDesignForProduct(productId: string) {
  router.push({ name: 'config-design', query: { productId } })
}

function badgeTone(status: Product['status']): 'success' | 'attention' | 'warning' {
  if (status === 'active') return 'success'
  if (status === 'draft') return 'attention'
  return 'warning'
}

function statusLabel(status: Product['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <div class="dashboard">
    <!-- Page header -->
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Personalization Dashboard</h1>
        <p class="dashboard-subtitle">Manage design configurations for your products</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalProducts }}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalConfigs }}</div>
        <div class="stat-label">Design Configs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ productsWithConfig }}</div>
        <div class="stat-label">Products Configured</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalProducts - productsWithConfig }}</div>
        <div class="stat-label">Awaiting Config</div>
      </div>
    </div>

    <!-- Products table section -->
    <div class="table-section">
      <div class="table-section-title">
        <Text as="h2" variant="headingMd">Products</Text>
      </div>

      <!-- Toolbar: search + filter + Add Config Design button -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">
            <TextField
              :model-value="searchQuery"
              placeholder="Search products…"
              type="search"
              auto-complete="off"
              clearButton
              @update:model-value="onSearchChange"
            />
          </div>
          <div class="toolbar-select">
            <Select
              label=""
              :options="statusOptions"
              :model-value="statusFilter"
              @update:model-value="onStatusChange"
            />
          </div>
        </div>
        <Button variant="primary" @click="goToConfigDesign">Add Config Design</Button>
      </div>

      <!-- Table -->
      <Card padding="0">
        <IndexTable
          :headings="tableHeadings"
          :item-count="totalFiltered"
          :selectable="false"
        >
          <IndexTableRow
            v-for="(product, index) in paginatedProducts"
            :id="product.id"
            :key="product.id"
            :position="index"
          >
            <!-- Product column -->
            <IndexTableCell>
              <InlineStack gap="300" blockAlign="center" :wrap="false">
                <Thumbnail
                  size="small"
                  :source="product.imageUrl ?? ''"
                  :alt="product.title"
                />
                <BlockStack gap="0">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">{{ product.title }}</Text>
                  <Text as="span" variant="bodySm" tone="subdued">{{ product.handle }}</Text>
                </BlockStack>
              </InlineStack>
            </IndexTableCell>

            <!-- Status column -->
            <IndexTableCell>
              <Badge :tone="badgeTone(product.status)">{{ statusLabel(product.status) }}</Badge>
            </IndexTableCell>

            <!-- Design Configs column -->
            <IndexTableCell>
              <template v-if="product.designConfigs.length > 0">
                <InlineStack gap="200" :wrap="true">
                  <Badge
                    v-for="cfg in product.designConfigs"
                    :key="cfg.id"
                  >
                    {{ cfg.name }} · {{ cfg.zones }} zone{{ cfg.zones !== 1 ? 's' : '' }}
                  </Badge>
                </InlineStack>
              </template>
              <Text v-else as="span" variant="bodySm" tone="subdued">No configs</Text>
            </IndexTableCell>

            <!-- Actions column -->
            <IndexTableCell>
              <Button variant="plain" @click="addDesignForProduct(product.id)">
                Add Design
              </Button>
            </IndexTableCell>
          </IndexTableRow>
        </IndexTable>
      </Card>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="table-pagination">
        <Pagination
          :has-previous="currentPage > 1"
          :has-next="currentPage < totalPages"
          @previous="currentPage--"
          @next="currentPage++"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.dashboard-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}

.dashboard-subtitle {
  font-size: 13px;
  color: var(--text2);
  margin: 0;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 12px;
  color: var(--text2);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

/* Table section */
.table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-section-title {
  margin-bottom: 2px;
}

/* Toolbar */
.table-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.toolbar-search {
  width: 260px;
  flex-shrink: 0;
}

.toolbar-select {
  width: 160px;
  flex-shrink: 0;
}

.table-pagination {
  display: flex;
  justify-content: center;
}

@media (max-width: 700px) {
  .dashboard {
    padding: 20px 16px 40px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar-left {
    flex-wrap: wrap;
  }

  .toolbar-search,
  .toolbar-select {
    width: 100%;
  }
}
</style>
