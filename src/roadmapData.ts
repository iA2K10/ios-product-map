export interface NavSection {
  name: string
  icon: string
  color: string
  flows: string[] // flow names from data.json
}

// Navigation sections organized by app tab bar
export const navSections: NavSection[] = [
  {
    name: 'Home',
    icon: '\u{1F3E0}',
    color: '#60a5fa',
    flows: ['Home', 'Recommended', 'Product detail', 'Product detail (gourmet)', 'Product images'],
  },
  {
    name: 'Likes',
    icon: '\u{2764}\u{FE0F}',
    color: '#f87171',
    flows: ['Like', 'Liking a product', 'Liked products', 'Edit a liked list', 'Save a product', 'Filtering products (Like)', 'Saving a search', 'Saving a search (search history)'],
  },
  {
    name: 'Sell',
    icon: '\u{1F4F7}',
    color: '#fb923c',
    flows: ['List (camera)', 'Selling a product', 'Listings', 'Editing a product information', 'Updating product information (auction)', 'Changing to an auction', 'Saving a listing to drafts', 'Copying a listing', 'Promoting a product'],
  },
  {
    name: 'Auction',
    icon: '\u{1F514}',
    color: '#facc15',
    flows: ['Searching Mercari', 'Searching products by categories', 'Searching products by brands', 'Searching similar products by picture', 'Image search history', 'Filtering products', 'Filtering by on sale only', 'Filtering products (user)', 'Sorting products', 'Switching view to list'],
  },
  {
    name: 'Wallet',
    icon: '\u{1F4B0}',
    color: '#34d399',
    flows: ['Use Merpay balance', 'Coupon', 'Apply for an installment payment'],
  },
  {
    name: 'Profile',
    icon: '\u{1F464}',
    color: '#c084fc',
    flows: ['User detail', 'Seller profile', 'Seller badge information', 'Following a user', 'Blocking a user', 'Share a user profile', 'Reviewing a product', 'Ratings', 'Delete a review', 'Update a review', 'Address list', 'Add a new address', 'Edit an address', 'Edit an address list', 'Deleting an address', 'Prefectures'],
  },
  {
    name: 'Onboarding',
    icon: '\u{1F44B}',
    color: '#4ade80',
    flows: ['Onboarding', 'Walkthrough', 'Verifying a phone number'],
  },
]

// Cross-flow navigation links: which flows can be reached from other flows
// These represent "tap to navigate" connections in the app
export const crossFlowLinks: Array<{ from: string; to: string; label?: string }> = [
  // From Home/Product to buying flows
  { from: 'Product detail', to: 'Buying a product', label: 'Buy' },
  { from: 'Product detail', to: 'Buy a product (pay later)', label: 'Pay later' },
  { from: 'Product detail', to: 'Request a price reduction', label: 'Offer' },
  { from: 'Product detail', to: 'Request a bulk purchase', label: 'Bulk buy' },
  { from: 'Product detail', to: 'Reporting a product', label: 'Report' },
  { from: 'Product detail', to: 'Commenting on a post', label: 'Comment' },
  { from: 'Product detail', to: 'Liking a product', label: 'Like' },
  { from: 'Product detail', to: 'Save a product', label: 'Save' },

  // From Product detail to seller
  { from: 'Product detail', to: 'Seller profile', label: 'View seller' },

  // From Buying to transaction
  { from: 'Buying a product', to: 'Change a drop-off location', label: 'Change pickup' },
  { from: 'Buying a product', to: 'Reviewing a product', label: 'Review' },
  { from: 'Buying a product', to: 'Sending a message', label: 'Message seller' },
  { from: 'Buying a product', to: 'Ratings', label: 'Rate' },

  // From Seller profile to user actions
  { from: 'Seller profile', to: 'Following a user', label: 'Follow' },
  { from: 'Seller profile', to: 'Blocking a user', label: 'Block' },
  { from: 'Seller profile', to: 'Share a user profile', label: 'Share' },

  // From Listings to editing
  { from: 'Listings', to: 'Editing a product information', label: 'Edit' },
  { from: 'Listings', to: 'Copying a listing', label: 'Copy' },
  { from: 'Listings', to: 'Promoting a product', label: 'Promote' },
  { from: 'Listings', to: 'Changing to an auction', label: 'Auction' },

  // Search to product
  { from: 'Searching Mercari', to: 'Product detail', label: 'View product' },
  { from: 'Searching products by categories', to: 'Product detail', label: 'View product' },
  { from: 'Searching products by brands', to: 'Product detail', label: 'View product' },

  // Messaging
  { from: 'Commenting on a post', to: 'Reacting to a message', label: 'React' },
  { from: 'Sending a message', to: 'Reacting to a message', label: 'React' },

  // Liked to product
  { from: 'Liked products', to: 'Product detail', label: 'View product' },
  { from: 'Like', to: 'Product detail', label: 'View product' },

  // Home to product
  { from: 'Home', to: 'Product detail', label: 'View product' },
  { from: 'Recommended', to: 'Product detail', label: 'View product' },
]

// Buying-related flows that branch from other tabs
export const sharedFlows: NavSection[] = [
  {
    name: 'Buying',
    icon: '\u{1F6D2}',
    color: '#22d3ee',
    flows: ['Buying a product', 'Buy a product (pay later)', 'Request a price reduction', 'Request a bulk purchase', 'Change a drop-off location'],
  },
  {
    name: 'Messaging',
    icon: '\u{1F4AC}',
    color: '#818cf8',
    flows: ['Commenting on a post', 'Reacting to a message', 'Sending a message'],
  },
  {
    name: 'Reports',
    icon: '\u{26A0}\u{FE0F}',
    color: '#f43f5e',
    flows: ['Reporting a product'],
  },
]
