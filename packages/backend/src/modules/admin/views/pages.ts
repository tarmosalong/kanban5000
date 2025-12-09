import { layout } from './layout.js';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: string[];
  createdAt: Date;
}

interface DashboardStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalIssues: number;
  recentUsers: User[];
}

/**
 * Dashboard page.
 */
export function dashboardPage(stats: DashboardStats): string {
  const content = `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-white mb-6">Dashboard</h2>
      
      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total Users</div>
          <div class="text-3xl font-bold text-white">${stats.totalUsers}</div>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Workspaces</div>
          <div class="text-3xl font-bold text-white">${stats.totalWorkspaces}</div>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Projects</div>
          <div class="text-3xl font-bold text-white">${stats.totalProjects}</div>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Issues</div>
          <div class="text-3xl font-bold text-white">${stats.totalIssues}</div>
        </div>
      </div>
      
      <!-- Recent users -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-700/50">
          <h3 class="font-semibold text-white">Recent Users</h3>
        </div>
        <div class="divide-y divide-slate-700/50">
          ${stats.recentUsers.length === 0 ? `
            <div class="px-4 py-8 text-center text-slate-500">No users yet</div>
          ` : stats.recentUsers.map(user => `
            <div class="px-4 py-3 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-medium">
                ${(user.name || user.email)[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-white truncate">${user.name || 'No name'}</div>
                <div class="text-sm text-slate-400 truncate">${user.email}</div>
              </div>
              <div class="text-xs text-slate-500">
                ${new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  return layout('Dashboard', content, 'dashboard');
}

/**
 * Users list page.
 */
export function usersPage(users: User[], message?: { type: 'success' | 'error'; text: string }): string {
  const content = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">Users</h2>
        <span class="text-sm text-slate-400">${users.length} total</span>
      </div>
      
      ${message ? `
        <div class="mb-4 px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}">
          ${message.text}
        </div>
      ` : ''}
      
      <!-- Users table -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Roles</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            ${users.length === 0 ? `
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-slate-500">No users found</td>
              </tr>
            ` : users.map(user => `
              <tr class="hover:bg-slate-700/30 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-medium shrink-0">
                      ${user.image ? `<img src="${user.image}" class="w-10 h-10 rounded-full" alt="" />` : (user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-white truncate">${user.name || 'No name'}</div>
                      <div class="text-sm text-slate-400 truncate">${user.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    ${(user.roles || []).map(role => `
                      <span class="px-2 py-0.5 text-xs rounded-full ${role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/50 text-slate-300'}">${role}</span>
                    `).join('')}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400">
                  ${new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a href="/admin/users/${user.id}/edit" class="px-2 py-1 text-xs bg-slate-600/50 hover:bg-slate-600 text-slate-300 rounded transition-colors">
                      Edit
                    </a>
                    <button 
                      onclick="if(confirm('Delete this user?')) { document.getElementById('delete-${user.id}').submit(); }"
                      class="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                    >
                      Delete
                    </button>
                    <form id="delete-${user.id}" action="/admin/users/${user.id}/delete" method="POST" style="display:none;"></form>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  return layout('Users', content, 'users');
}

/**
 * Edit user page.
 */
export function editUserPage(user: User, message?: { type: 'success' | 'error'; text: string }): string {
  const content = `
    <div class="p-6">
      <div class="mb-6">
        <a href="/admin/users" class="text-sm text-slate-400 hover:text-white transition-colors">← Back to Users</a>
        <h2 class="text-2xl font-bold text-white mt-2">Edit User</h2>
      </div>
      
      ${message ? `
        <div class="mb-4 px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}">
          ${message.text}
        </div>
      ` : ''}
      
      <form action="/admin/users/${user.id}/edit" method="POST" class="max-w-xl bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input 
            type="email" 
            name="email" 
            value="${user.email}"
            class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input 
            type="text" 
            name="name" 
            value="${user.name || ''}"
            class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Roles</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input type="checkbox" name="roles" value="user" ${(user.roles || []).includes('user') ? 'checked' : ''} class="rounded border-slate-600 text-primary-500 focus:ring-primary-500/50" />
              <span class="text-sm text-slate-300">User</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" name="roles" value="admin" ${(user.roles || []).includes('admin') ? 'checked' : ''} class="rounded border-slate-600 text-primary-500 focus:ring-primary-500/50" />
              <span class="text-sm text-slate-300">Admin</span>
            </label>
          </div>
        </div>
        
        <div class="pt-4 flex gap-3">
          <button 
            type="submit"
            class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Save Changes
          </button>
          <a 
            href="/admin/users"
            class="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  `;
  
  return layout('Edit User', content, 'users');
}

