/**
 * Admin UI layout template.
 */
export function layout(title: string, content: string, activePage: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Kanban5000 Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#f0fdfa',
              100: '#ccfbf1',
              200: '#99f6e4',
              300: '#5eead4',
              400: '#2dd4bf',
              500: '#14b8a6',
              600: '#0d9488',
              700: '#0f766e',
              800: '#115e59',
              900: '#134e4a',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .sidebar-link.active { background: rgba(20, 184, 166, 0.1); color: #14b8a6; border-left-color: #14b8a6; }
  </style>
</head>
<body class="dark bg-slate-900 text-slate-100 min-h-screen">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
      <div class="p-4 border-b border-slate-700/50">
        <h1 class="text-xl font-bold text-primary-400">🛠️ Admin Panel</h1>
        <p class="text-xs text-slate-500 mt-1">Kanban5000</p>
      </div>
      
      <nav class="flex-1 p-4 space-y-1">
        <a href="/admin" class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 border-transparent hover:bg-slate-700/50 transition-colors ${activePage === 'dashboard' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </a>
        
        <a href="/admin/users" class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 border-transparent hover:bg-slate-700/50 transition-colors ${activePage === 'users' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Users
        </a>
        
        <a href="/admin/roles" class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 border-transparent hover:bg-slate-700/50 transition-colors ${activePage === 'roles' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Roles
        </a>
        
        <a href="/admin/workspaces" class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 border-transparent hover:bg-slate-700/50 transition-colors ${activePage === 'workspaces' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Workspaces
        </a>
        
        <a href="/admin/stats" class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm border-l-2 border-transparent hover:bg-slate-700/50 transition-colors ${activePage === 'stats' ? 'active' : ''}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statistics
        </a>
      </nav>
      
      <div class="p-4 border-t border-slate-700/50">
        <a href="/admin/logout" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </a>
      </div>
    </aside>
    
    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      ${content}
    </main>
  </div>
</body>
</html>`;
}

/**
 * Login page template.
 */
export function loginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Kanban5000 Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              400: '#2dd4bf',
              500: '#14b8a6',
              600: '#0d9488',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="dark bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-primary-400">🛠️ Admin Panel</h1>
      <p class="text-slate-500 mt-2">Kanban5000 Administration</p>
    </div>
    
    <form method="POST" action="/admin/login" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
      ${error ? `<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">${error}</div>` : ''}
      
      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-2">Admin Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required
          autofocus
          class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          placeholder="Enter admin password"
        />
      </div>
      
      <button 
        type="submit"
        class="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
      >
        Login
      </button>
    </form>
    
    <p class="text-center text-slate-600 text-xs mt-6">
      Default password: admin123 (change via ADMIN_PASSWORD env var)
    </p>
  </div>
</body>
</html>`;
}

