# TrackMyExpenses - Project Flowchart Documentation

## Table of Contents
1. System Architecture
2. User Authentication Flow
3. Application Navigation Flow
4. Data Flow Architecture
5. API Endpoints Map
6. Feature Workflows

---

## 1. System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Web Browser]
        HTML[HTML Pages]
        CSS[CSS Styles]
        JS[JavaScript]
    end
    
    subgraph "Server Layer"
        Express[Express.js Server]
        Routes[Route Handlers]
        Auth[Authentication]
        Session[Session Management]
    end
    
    subgraph "Data Layer"
        Users[(users.xlsx)]
        Expenses[(expenses.xlsx)]
        Uploads[/uploads/]
    end
    
    UI --> HTML
    UI --> CSS
    UI --> JS
    JS --> Express
    Express --> Routes
    Express --> Auth
    Express --> Session
    Routes --> Users
    Routes --> Expenses
    Routes --> Uploads
    
    style UI fill:#1e5f3f,color:#fff
    style Express fill:#0a2540,color:#fff
    style Users fill:#d4af37,color:#000
    style Expenses fill:#d4af37,color:#000
```

---

## 2. User Authentication Flow

```mermaid
flowchart TD
    Start([User Opens Application]) --> Login[Login Page]
    Login --> HasAccount{Has Account?}
    
    HasAccount -->|No| Signup[Signup Page]
    Signup --> EnterDetails[Enter Name, Email, Password, Budget]
    EnterDetails --> ValidateSignup{Valid Data?}
    ValidateSignup -->|No| SignupError[Show Error]
    SignupError --> Signup
    ValidateSignup -->|Yes| CreateUser[Create User in users.xlsx]
    CreateUser --> LoginSuccess
    
    HasAccount -->|Yes| EnterCreds[Enter Email & Password]
    EnterCreds --> ValidateLogin{Valid Credentials?}
    ValidateLogin -->|No| LoginError[Show Error]
    LoginError --> Login
    ValidateLogin -->|Yes| CheckRole{Check User Role}
    
    CheckRole -->|Admin| AdminSession[Create Admin Session]
    CheckRole -->|User| UserSession[Create User Session]
    
    AdminSession --> LoginSuccess[Redirect to Dashboard]
    UserSession --> LoginSuccess
    
    LoginSuccess --> Dashboard[Dashboard Page]
    
    style Start fill:#1e5f3f,color:#fff
    style Dashboard fill:#d4af37,color:#000
    style LoginSuccess fill:#2d8659,color:#fff
```

---

## 3. Application Navigation Flow

```mermaid
flowchart LR
    Dashboard[Dashboard] --> |View Stats| Dashboard
    Dashboard --> |Add Expense| Tracking
    Dashboard --> |View Reports| Reports
    Dashboard --> |Manage Savings| Savings
    Dashboard --> |Settings| Profile
    Dashboard --> |Admin Only| Admin
    
    Tracking[Expense Tracking] --> |Add New| AddExpense[Add Expense Form]
    Tracking --> |Edit| EditExpense[Edit Expense]
    Tracking --> |Delete| DeleteExpense[Delete Expense]
    Tracking --> |Filter| FilterExpenses[Filter by Category/Date]
    
    Reports[Reports & Analytics] --> |Charts| ViewCharts[View Charts]
    Reports --> |Export| ExportData[Export to Excel]
    Reports --> |Trends| ViewTrends[View Trends]
        Savings[Savings] --> |Goals| SavingsGoals[View Savings Goals]
    Savings --> |Insights| FinancialInsights[View Financial Insights]
    Savings --> |Tips| SavingsTips[View Savings Tips]
    
    Profile[Profile] --> |Update Info| UpdateProfile[Update Profile Info]
    Profile --> |Change Budget| ChangeBudget[Change Monthly Budget]
    Profile --> |Branding| CustomBranding[Upload Logo & Title]
    Profile --> |Stats| ProfileStats[View Financial Stats]
    
    Admin[Admin Panel] --> |Users| ManageUsers[Manage All Users]
    Admin --> |Expenses| ViewAllExpenses[View All Expenses]
    Admin --> |Export| AdminExport[Export System Data]
    
    style Dashboard fill:#1e5f3f,color:#fff
    style Tracking fill:#2d8659,color:#fff
    style Reports fill:#0a2540,color:#fff
    style Savings fill:#d4af37,color:#000
    style Profile fill:#1e3a5f,color:#fff
    style Admin fill:#c62828,color:#fff
```

---

## 4. Data Flow Architecture

```mermaid
flowchart TB
    subgraph "Frontend"
        Page[HTML Page]
        FormData[User Input / Form Data]
        Display[Display Results]
    end
    
    subgraph "API Layer"
        API[/api/ endpoints]
        AuthCheck{Authenticated?}
        RoleCheck{Authorized?}
    end
    
    subgraph "Business Logic"
        Auth[auth.js]
        Expenses[expenses.js]
        Analytics[analytics.js]
        Chatbot[chatbot.js]
        Excel[excel.js]
    end
    
    subgraph "Data Storage"
        UsersDB[(users.xlsx)]
        ExpensesDB[(expenses.xlsx)]
        UploadsDir[/uploads/]
    end
    
    Page --> FormData
    FormData --> API
    API --> AuthCheck
    AuthCheck -->|No| ErrorResponse[401 Unauthorized]
    AuthCheck -->|Yes| RoleCheck
    RoleCheck -->|No| ForbiddenResponse[403 Forbidden]
    RoleCheck -->|Yes| Router{Route to Handler}
    
    Router -->|/login, /signup| Auth
    Router -->|/expenses, /dashboard| Expenses
    Router -->|/analytics, /reports| Analytics
    Router -->|/chatbot| Chatbot
    
    Auth --> Excel
    Expenses --> Excel
    Analytics --> Excel
    
    Excel --> UsersDB
    Excel --> ExpensesDB
    Excel --> UploadsDir
    
    Excel --> Response[JSON Response]
    ErrorResponse --> Display
    ForbiddenResponse --> Display
    Response --> Display
    
    style FormData fill:#1e5f3f,color:#fff
    style Response fill:#2d8659,color:#fff
    style UsersDB fill:#d4af37,color:#000
    style ExpensesDB fill:#d4af37,color:#000
```

---

## 5. API Endpoints Map

```mermaid
graph LR
    subgraph "Authentication APIs"
        A1[POST /api/login]
        A2[POST /api/signup]
        A3[POST /api/logout]
        A4[GET /api/profile/:userId]
        A5[PUT /api/profile/:userId]
    end
    
    subgraph "Expense APIs"
        E1[GET /api/expenses/:userId]
        E2[POST /api/expenses]
        E3[PUT /api/expenses/:id]
        E4[DELETE /api/expenses/:id]
        E5[GET /api/dashboard/:userId]
    end
    
    subgraph "Analytics APIs"
        AN1[GET /api/analytics/:userId]
        AN2[GET /api/reports/:userId]
        AN3[GET /api/trends/:userId]
    end
    
    subgraph "Admin APIs"
        AD1[GET /api/admin/users]
        AD2[GET /api/admin/expenses]
        AD3[POST /api/admin/export]
    end
    
    subgraph "Chatbot APIs"
        C1[POST /api/chatbot/query]
    end
    
    subgraph "Branding APIs"
        B1[POST /api/branding]
        B2[GET /api/branding/:userId]
    end
    
    style A1 fill:#1e5f3f,color:#fff
    style E1 fill:#2d8659,color:#fff
    style AN1 fill:#0a2540,color:#fff
    style AD1 fill:#c62828,color:#fff
    style C1 fill:#d4af37,color:#000
    style B1 fill:#1e3a5f,color:#fff
```

---

## 6. Feature Workflows

### 6.1 Add Expense Workflow

```mermaid
flowchart TD
    Start([User Clicks Add Expense]) --> Form[Show Expense Form]
    Form --> FillData[Enter: Amount, Category, Payment, Date, Notes]
    FillData --> Validate{Validate Input?}
    
    Validate -->|Invalid| ShowError[Show Validation Error]
    ShowError --> Form
    
    Validate -->|Valid| SendAPI[POST /api/expenses]
    SendAPI --> SaveDB[Save to expenses.xlsx]
    SaveDB --> UpdateCache[Update Session Cache]
    UpdateCache --> Success[Show Success Message]
    Success --> Refresh[Refresh Expense List]
    Refresh --> End([Expense Added])
    
    style Start fill:#1e5f3f,color:#fff
    style End fill:#2d8659,color:#fff
    style SaveDB fill:#d4af37,color:#000
```

### 6.2 Dashboard Loading Workflow

```mermaid
flowchart TD
    Start([User Opens Dashboard]) --> CheckAuth{Authenticated?}
    CheckAuth -->|No| Redirect[Redirect to Login]
    CheckAuth -->|Yes| FetchData[GET /api/dashboard/:userId]
    
    FetchData --> CalcStats[Calculate Statistics]
    CalcStats --> ProcessData{Process Data}
    
    ProcessData --> TotalSpent[Total Expenses]
    ProcessData --> Budget[Budget Status]
    ProcessData --> Savings[Savings Amount]
    ProcessData --> Categories[Category Breakdown]
    ProcessData --> Trends[Spending Trends]
    
    TotalSpent --> Render
    Budget --> Render
    Savings --> Render
    Categories --> RenderCharts[Render Pie Chart]
    Trends --> RenderTrends[Render Line Chart]
    
    Render[Render Stat Cards] --> Complete
    RenderCharts --> Complete
    RenderTrends --> Complete
    
    Complete[Dashboard Rendered] --> LoadAI[Load AI Insights]
    LoadAI --> LoadRecent[Load Recent Transactions]
    LoadRecent --> End([Dashboard Ready])
    
    style Start fill:#1e5f3f,color:#fff
    style End fill:#2d8659,color:#fff
    style Complete fill:#d4af37,color:#000
```

### 6.3 Chatbot Interaction Workflow

```mermaid
flowchart TD
    Start([User Opens Chatbot]) --> WelcomeMsg[Show Welcome Message]
    WelcomeMsg --> ShowSuggestions[Show Quick Suggestions]
    ShowSuggestions --> WaitInput[Wait for User Input]
    
    WaitInput --> UserQuery[User Enters Question]
    UserQuery --> SendQuery[POST /api/chatbot/query]
    SendQuery --> AnalyzeIntent[Analyze Query Intent]
    
    AnalyzeIntent --> CheckType{Query Type?}
    
    CheckType -->|Spending| GetExpenses[Fetch User Expenses]
    CheckType -->|Budget| GetBudget[Fetch Budget Info]
    CheckType -->|Tips| GetTips[Generate Savings Tips]
    CheckType -->|Category| GetCategory[Fetch Category Data]
    
    GetExpenses --> GenResponse
    GetBudget --> GenResponse
    GetTips --> GenResponse
    GetCategory --> GenResponse
    
    GenResponse[Generate AI Response] --> DisplayResponse[Display Response]
    DisplayResponse --> WaitInput
    
    style Start fill:#1e5f3f,color:#fff
    style GenResponse fill:#d4af37,color:#000
    style DisplayResponse fill:#2d8659,color:#fff
```

### 6.4 Admin Export Workflow

```mermaid
flowchart TD
    Start([Admin Clicks Export]) --> CheckRole{Is Admin?}
    CheckRole -->|No| AccessDenied[403 Forbidden]
    CheckRole -->|Yes| ShowOptions[Show Export Options]
    
    ShowOptions --> SelectType{Export Type?}
    
    SelectType -->|All Users| FetchUsers[Fetch All Users Data]
    SelectType -->|All Expenses| FetchExpenses[Fetch All Expenses]
    SelectType -->|Analytics| FetchAnalytics[Generate Analytics Report]
    
    FetchUsers --> CreateExcel
    FetchExpenses --> CreateExcel
    FetchAnalytics --> CreateExcel
    
    CreateExcel[Create Excel File] --> DownloadFile[Download .xlsx File]
    DownloadFile --> End([Export Complete])
    
    style Start fill:#1e5f3f,color:#fff
    style End fill:#2d8659,color:#fff
    style CreateExcel fill:#d4af37,color:#000
```

---

## 7. Database Schema (Excel Files)

### users.xlsx Structure
```
| id | email | password (hashed) | fullName | role | budget | createdAt | customTitle | customLogo |
```

### expenses.xlsx Structure
```
| id | userId | amount | category | paymentMode | date | notes | tags | createdAt |
```

---

## 8. Technology Stack Flow

```mermaid
graph TB
    subgraph "Frontend Technologies"
        HTML5[HTML5 - Structure]
        CSS3[CSS3 - Styling]
        JS[Vanilla JavaScript]
        C3[C3.js - Charts]
        FA[Font Awesome - Icons]
    end
    
    subgraph "Backend Technologies"
        Node[Node.js Runtime]
        Express[Express.js Framework]
        Session[express-session]
        Bcrypt[bcrypt - Password Hashing]
        Multer[Multer - File Upload]
    end
    
    subgraph "Data Technologies"
        XLSX[XLSX - Excel Processing]
        FileSystem[File System Storage]
    end
    
    HTML5 --> Browser[Web Browser]
    CSS3 --> Browser
    JS --> Browser
    C3 --> Browser
    FA --> Browser
    
    Browser --> Node
    Node --> Express
    Express --> Session
    Express --> Bcrypt
    Express --> Multer
    Express --> XLSX
    XLSX --> FileSystem
    
    style Node fill:#1e5f3f,color:#fff
    style Express fill:#0a2540,color:#fff
    style Browser fill:#2d8659,color:#fff
    style FileSystem fill:#d4af37,color:#000
```

---

## How to Convert to PDF

### Method 1: Using Browser
1. Open this file in a browser (VS Code Preview, GitHub, etc.)
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
3. Select "Save as PDF"
4. Click Save

### Method 2: Using Markdown to PDF Tools
```bash
# Install markdown-pdf
npm install -g markdown-pdf

# Convert to PDF
markdown-pdf flowchart.md -o TrackMyExpenses_Flowchart.pdf
```

### Method 3: Using Pandoc
```bash
# Install pandoc
# Then run:
pandoc flowchart.md -o TrackMyExpenses_Flowchart.pdf
```

### Method 4: Using Online Tools
- Visit: https://www.markdowntopdf.com/
- Upload this file
- Download PDF

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Project**: TrackMyExpenses - Modern Expense Tracker
