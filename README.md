# TrackMyExpenses - Modern Expense Tracker

A beautiful, feature-rich expense tracking web application with AI-powered insights, analytics, and a helpful financial chatbot.

## 🚀 Features

- **User Authentication** - Secure login/signup with role-based access (User/Admin)
- **Expense Tracking** - Track expenses by category, payment mode, and date
- **Dashboard** - Beautiful animated dashboard with charts and statistics
- **Budget Management** - Set monthly budgets and track spending progress
- **Smart Insights** - AI-powered suggestions and spending pattern analysis
- **Chatbot Assistant** - Financial chatbot for budget advice and expense queries
- **Savings Goals** - Create and track savings goals
- **Reports & Analytics** - Comprehensive analytics with charts and trends
- **Admin Panel** - Manage users, view all expenses, and export data to Excel
- **Custom Branding** - Upload custom logo and title
- **Responsive Design** - Works perfectly on mobile and desktop

## 📋 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Charts**: C3.js (based on D3.js)
- **Database**: Excel files (XLSX)
- **Authentication**: bcrypt, express-session
- **File Upload**: Multer

## 🛠️ Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Start the Server**

```bash
npm start
```

3. **Access the Application**

Open your browser and navigate to:
```
http://localhost:3000
```

## 🔑 Demo Credentials

### User Account
- **Email**: user@demo.com
- **Password**: user123

### Admin Account
- **Email**: sidhi@admin.com
- **Password**: admin123

## 📁 Project Structure

```
TrackMyExpenses/
├── public/
│   ├── css/
│   │   ├── main.css          # Design system & variables
│   │   ├── dashboard.css     # Dashboard styles
│   │   └── auth.css          # Authentication pages
│   ├── js/
│   │   ├── auth.js           # Authentication logic
│   │   ├── dashboard.js      # Dashboard & charts
│   │   ├── expenses.js       # Expense management
│   │   └── chatbot.js        # Chatbot interface
│   ├── images/               # App images and icons
│   └── uploads/              # User uploaded files
├── views/
│   ├── index.html            # Login page
│   ├── signup.html           # Registration page
│   ├── dashboard.html        # Main dashboard
│   ├── tracking.html         # Expense tracking
│   ├── savings.html          # Savings goals
│   ├── reports.html          # Analytics & reports
│   ├── profile.html          # User profile
│   └── admin.html            # Admin panel
├── server/
│   ├── server.js             # Express server
│   ├── auth.js               # Authentication routes
│   ├── expenses.js           # Expense routes
│   ├── excel.js              # Excel operations
│   ├── analytics.js          # Analytics engine
│   └── chatbot.js            # Chatbot logic
├── data/
│   ├── users.xlsx            # User data
│   └── expenses.xlsx         # Expense records
├── package.json
└── README.md
```

## 🎨 Features Breakdown

### Dashboard
- Total spent, savings, and budget overview
- Animated stat cards
- Budget progress bar with color coding
- Category-wise pie chart
- Monthly spending trends line chart
- Smart AI insights
- Recent transactions list
- Overspending alerts

### Expense Tracking
- Add/Edit/Delete expenses
- Category selection (Food, Travel, Shopping, etc.)
- Payment mode tracking (Cash, UPI, Card, Net Banking)
- Notes and tags
- Date filtering
- Category filtering

### Chatbot
- Natural language queries about spending
- Budget advice and suggestions
- Category breakdown analysis
- Overspending detection
- Personalized savings tips
- Spending habit analysis

### Admin Panel
- View all users
- View all expenses across users
- Export data to Excel
- User analytics
- Overspending user identification
- System statistics

### Profile & Customization
- Update profile information
- Set monthly budget
- Upload custom logo
- Change app title
- View account details

## 🔧 Configuration

### Port Configuration
Default port is `3000`. To change:

```javascript
// In server/server.js
const PORT = process.env.PORT || 3000;
```

### Session Secret
For production, change the session secret:

```javascript
// In server/server.js
secret: 'your-secret-key-here'
```

## 📊 Excel Data Storage

The application uses Excel files for data storage:

- **users.xlsx** - Stores user credentials and profiles
- **expenses.xlsx** - Stores all expense records

**Note**: This approach is suitable for demo and small-scale use. For production with multiple concurrent users, consider migrating to a database like PostgreSQL or MongoDB.

## 🎯 Category Icons & Colors

| Category | Icon | Color |
|----------|------|-------|
| Food | 🍔 | Red |
| Travel | 🚗 | Blue |
| Shopping | 🛍️ | Pink |
| Bills | 📄 | Purple |
| Entertainment | 🎬 | Yellow |
| Health | 💊 | Cyan |
| Education | 📚 | Indigo |
| Other | 📌 | Gray |

## 🤖 Chatbot Commands

The chatbot understands natural language queries like:

- "How much did I spend?"
- "Am I overspending?"
- "Show me my food expenses"
- "Give me budget tips"
- "How can I save money?"
- "What's my biggest expense?"
- "Show my spending patterns"

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- File upload validation
- Input sanitization

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints for tablets and phones
- Touch-friendly interface
- Collapsible sidebar on mobile
- Full-screen chatbot on mobile

## 🚧 Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- AI-powered expense categorization
- Receipt OCR scanning
- Budget sharing with family
- Recurring expense tracking
- Multi-currency support
- Email notifications
- Data export to PDF
- Expense splitting

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use  a different port
set PORT=3001 && npm start
```

### Excel File Errors
If you encounter Excel file errors, delete the files in the `data/` folder and restart the server. They will be recreated automatically.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.

## 🎉 Acknowledgments

- C3.js for beautiful charts
- Font Awesome for icons
- Google Fonts for typography

---

**Built with ❤️ for better financial management**
