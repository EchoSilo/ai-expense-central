# AI Cost Tracker 🤖💰

A modern web application to track and manage all your AI service subscriptions and costs in one centralized dashboard.

## 🚀 Features

- **Centralized Tracking**: Monitor all your AI subscriptions (ChatGPT, Claude, GitHub Copilot, API credits, etc.) in one place
- **Visual Analytics**: Interactive charts showing spending breakdown by service and category
- **Smart Statistics**: Real-time calculations of monthly, yearly, and total costs
- **Service Management**: Easy add, edit, and delete functionality for AI services
- **Billing Reminders**: Track next billing dates to avoid surprises
- **Category Organization**: Organize services by subscriptions, credits, and one-time purchases
- **Responsive Design**: Beautiful, mobile-friendly interface with dark/light theme support

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-cost-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Usage

1. **Add AI Services**: Click the "Add Service" button to add your AI subscriptions
2. **Track Costs**: Enter service details including name, provider, cost, and billing cycle
3. **View Analytics**: Check the dashboard for spending breakdowns and trends
4. **Manage Services**: Edit or delete services as your subscriptions change
5. **Monitor Spending**: Keep track of monthly and yearly AI expenses

## 📊 Supported Service Types

- **Subscriptions**: Monthly/yearly recurring services (ChatGPT Plus, Claude Pro, etc.)
- **API Credits**: Pay-as-you-go services (OpenAI API, Anthropic API, etc.)
- **One-time Purchases**: Single payments for AI tools and services

## 🎨 Design System

The app uses a custom design system with:
- Semantic color tokens for consistent theming
- Gradient backgrounds and hover effects
- Responsive grid layouts
- Accessible form components
- Smooth animations and transitions

## 🔧 Development

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── AIServiceCard.tsx    # Service display card
│   ├── AddServiceDialog.tsx # Add/edit service modal
│   ├── SpendingChart.tsx    # Analytics charts
│   └── StatsOverview.tsx    # Dashboard statistics
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── index.css           # Global styles and design tokens
```

### Key Components
- `AIServiceCard`: Displays individual service information with edit/delete actions
- `AddServiceDialog`: Modal form for adding and editing services
- `SpendingChart`: Pie and bar charts for cost visualization
- `StatsOverview`: Dashboard cards showing key metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Deployment

This project can be deployed to:
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **Any static hosting**: Build and deploy the `dist` folder

## 💡 Future Enhancements

- [ ] Data persistence with backend integration
- [ ] User authentication and multi-user support
- [ ] CSV export functionality
- [ ] Budget alerts and notifications
- [ ] Integration with actual service APIs
- [ ] Mobile app version
- [ ] Advanced analytics and insights

## 📞 Support

If you have any questions or need help, please open an issue in this repository.

---

**Made with ❤️ for the AI community**