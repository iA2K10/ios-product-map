export interface RoadmapGroup {
  name: string
  flows: string[]
}

export interface RoadmapTab {
  name: string
  icon: string
  color: string
  groups: RoadmapGroup[]
}

export const roadmapTabs: RoadmapTab[] = [
  {
    name: 'Home',
    icon: '\u{1F3E0}',
    color: '#60a5fa',
    groups: [
      { name: 'Home screens', flows: ['Home'] },
      { name: 'Recommended', flows: ['Recommended'] },
      { name: 'Product detail', flows: ['Product detail', 'Product detail (gourmet)', 'Product images'] },
      { name: 'Buying', flows: ['Buying a product', 'Buy a product (pay later)', 'Apply for an installment payment', 'Change a drop-off location', 'Request a bulk purchase', 'Request a price reduction'] },
      { name: 'Messaging', flows: ['Commenting on a post', 'Reacting to a message', 'Sending a message'] },
      { name: 'Reports', flows: ['Reporting a product'] },
    ],
  },
  {
    name: 'Likes',
    icon: '\u{2764}\u{FE0F}',
    color: '#f87171',
    groups: [
      { name: 'Like', flows: ['Like', 'Liking a product'] },
      { name: 'Liked products', flows: ['Liked products', 'Edit a liked list', 'Filtering products (Like)'] },
      { name: 'Save a product', flows: ['Save a product'] },
      { name: 'Saved searches', flows: ['Saving a search', 'Saving a search (search history)'] },
    ],
  },
  {
    name: 'Sell',
    icon: '\u{1F4F7}',
    color: '#fb923c',
    groups: [
      { name: 'List (camera)', flows: ['List (camera)'] },
      { name: 'Selling a product', flows: ['Selling a product'] },
      { name: 'Listings', flows: ['Listings'] },
      { name: 'Editing listings', flows: ['Editing a product information', 'Updating product information (auction)'] },
      { name: 'Auction', flows: ['Changing to an auction'] },
      { name: 'Drafts & Copy', flows: ['Saving a listing to drafts', 'Copying a listing'] },
      { name: 'Promoting', flows: ['Promoting a product'] },
    ],
  },
  {
    name: 'Auction',
    icon: '\u{1F514}',
    color: '#facc15',
    groups: [
      { name: 'Search', flows: ['Searching Mercari'] },
      { name: 'Browse by category', flows: ['Searching products by categories', 'Searching products by brands'] },
      { name: 'Image search', flows: ['Searching similar products by picture', 'Image search history'] },
      { name: 'Filtering', flows: ['Filtering products', 'Filtering by on sale only', 'Filtering products (user)'] },
      { name: 'Sorting & Display', flows: ['Sorting products', 'Switching view to list'] },
    ],
  },
  {
    name: 'Wallet',
    icon: '\u{1F4B0}',
    color: '#34d399',
    groups: [
      { name: 'Merpay balance', flows: ['Use Merpay balance'] },
      { name: 'Coupons', flows: ['Coupon'] },
    ],
  },
  {
    name: 'Notifications',
    icon: '\u{1F514}',
    color: '#22d3ee',
    groups: [],
  },
  {
    name: 'To-Do',
    icon: '\u{2705}',
    color: '#a78bfa',
    groups: [],
  },
  {
    name: 'Profile',
    icon: '\u{1F464}',
    color: '#c084fc',
    groups: [
      { name: 'User profile', flows: ['User detail', 'Seller profile', 'Seller badge information'] },
      { name: 'Social', flows: ['Following a user', 'Blocking a user', 'Share a user profile'] },
      { name: 'Reviews & Ratings', flows: ['Reviewing a product', 'Ratings', 'Delete a review', 'Update a review'] },
      { name: 'Address management', flows: ['Address list', 'Add a new address', 'Edit an address', 'Edit an address list', 'Deleting an address', 'Prefectures'] },
      { name: 'Onboarding', flows: ['Onboarding', 'Walkthrough', 'Verifying a phone number'] },
    ],
  },
]
