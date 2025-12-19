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
export function editUserPage(
  user: User, 
  message?: { type: 'success' | 'error'; text: string },
  allRoles: { id: string; name: string }[] = []
): string {
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
            ${allRoles.map(role => `
              <label class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="roles" 
                  value="${role.id}" 
                  ${(user.roles || []).includes(role.name) ? 'checked' : ''} 
                  class="rounded border-slate-600 text-primary-500 focus:ring-primary-500/50" 
                />
                <span class="text-sm text-slate-300">${role.name}</span>
              </label>
            `).join('')}
            ${allRoles.length === 0 ? '<p class="text-xs text-slate-500 italic">No roles available. Create them first.</p>' : ''}
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

interface Role {
  id: string;
  name: string;
  description: string | null;
  userCount?: number;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  action: string;
  resource: string;
  scope: string | null;
}

/**
 * Roles list page.
 */
export function rolesPage(roles: Role[], message?: { type: 'success' | 'error'; text: string }): string {
  const content = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">Roles</h2>
        <a href="/admin/roles/new" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
          + Create Role
        </a>
      </div>
      
      ${message ? `
        <div class="mb-4 px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}">
          ${message.text}
        </div>
      ` : ''}
      
      <!-- Roles table -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Description</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Users</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            ${roles.length === 0 ? `
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-slate-500">No roles found</td>
              </tr>
            ` : roles.map(role => `
              <tr class="hover:bg-slate-700/30 transition-colors">
                <td class="px-4 py-3">
                  <div class="font-medium text-white">${role.name}</div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400">
                  ${role.description || '<span class="italic opacity-50">No description</span>'}
                </td>
                <td class="px-4 py-3 text-sm text-slate-400">
                  ${role.userCount ?? 0}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a href="/admin/roles/${role.id}/edit" class="px-2 py-1 text-xs bg-slate-600/50 hover:bg-slate-600 text-slate-300 rounded transition-colors">
                      Edit
                    </a>
                    ${role.name !== 'admin' ? `
                      <button 
                        onclick="if(confirm('Delete this role? This might affect user access.')) { document.getElementById('delete-role-${role.id}').submit(); }"
                        class="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                      >
                        Delete
                      </button>
                      <form id="delete-role-${role.id}" action="/admin/roles/${role.id}/delete" method="POST" style="display:none;"></form>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  return layout('Roles', content, 'roles');
}

/**
 * Edit/Create role page.
 */
export function editRolePage(
  role?: Role, 
  message?: { type: 'success' | 'error'; text: string }
): string {
  const isNew = !role;
  const content = `
    <div class="p-6">
      <div class="mb-6">
        <a href="/admin/roles" class="text-sm text-slate-400 hover:text-white transition-colors">← Back to Roles</a>
        <h2 class="text-2xl font-bold text-white mt-2">${isNew ? 'Create New Role' : 'Edit Role'}</h2>
      </div>
      
      ${message ? `
        <div class="mb-4 px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}">
          ${message.text}
        </div>
      ` : ''}
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form action="${isNew ? '/admin/roles/new' : `/admin/roles/${role.id}/edit`}" method="POST" class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4 h-fit">
          <h3 class="text-lg font-semibold text-white mb-4">Role Details</h3>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Role Name</label>
            <input 
              type="text" 
              name="name" 
              value="${role?.name || ''}"
              required
              ${role?.name === 'admin' ? 'readonly' : ''}
              class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 ${role?.name === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}"
              placeholder="e.g. manager"
            />
            ${role?.name === 'admin' ? '<p class="text-xs text-slate-500 mt-1">The admin role name cannot be changed.</p>' : ''}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea 
              name="description" 
              rows="3"
              class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="What this role can do..."
            >${role?.description || ''}</textarea>
          </div>
          
          <div class="pt-4 flex gap-3">
            <button 
              type="submit"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              ${isNew ? 'Create Role' : 'Save Changes'}
            </button>
            <a 
              href="/admin/roles"
              class="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>

        ${!isNew ? `
          <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Permissions</h3>
            
            <div class="space-y-4">
              <!-- Current permissions -->
              <div class="divide-y divide-slate-700/50 border border-slate-700/50 rounded-lg overflow-hidden">
                ${(role.permissions || []).length === 0 ? `
                  <div class="p-4 text-center text-slate-500 text-sm">No permissions assigned to this role</div>
                ` : role.permissions!.map(p => `
                  <div class="p-3 flex items-center justify-between group">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 bg-primary-500/10 text-primary-400 rounded text-xs font-mono uppercase">${p.action}</span>
                        <span class="text-slate-500">on</span>
                        <span class="text-white font-medium">${p.resource}</span>
                      </div>
                      ${p.scope ? `<div class="text-[10px] text-slate-500 mt-0.5">Scope: ${p.scope}</div>` : ''}
                    </div>
                    <button 
                      onclick="if(confirm('Remove this permission?')) { document.getElementById('remove-perm-${p.id}').submit(); }"
                      class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Remove permission"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <form id="remove-perm-${p.id}" action="/admin/roles/${role.id}/permissions/${p.id}/delete" method="POST" style="display:none;"></form>
                  </div>
                `).join('')}
              </div>

              <!-- Add new permission form -->
              <form action="/admin/roles/${role.id}/permissions/add" method="POST" class="pt-4 border-t border-slate-700/50">
                <h4 class="text-sm font-medium text-slate-400 mb-3">Add Permission</h4>
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-[10px] text-slate-500 uppercase mb-1">Action</label>
                    <select name="action" class="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-primary-500">
                      <option value="*">All (*)</option>
                      <option value="read">Read</option>
                      <option value="create">Create</option>
                      <option value="update">Update</option>
                      <option value="delete">Delete</option>
                      <option value="manage">Manage</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] text-slate-500 uppercase mb-1">Resource</label>
                    <select name="resource" class="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-primary-500">
                      <option value="*">All (*)</option>
                      <option value="workspace">Workspace</option>
                      <option value="project">Project</option>
                      <option value="issue">Issue</option>
                      <option value="user">User</option>
                      <option value="comment">Comment</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] text-slate-500 uppercase mb-1">Scope (Optional)</label>
                  <input type="text" name="scope" placeholder="e.g. own" class="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-primary-500" />
                </div>
                <button type="submit" class="w-full mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors">
                  Add Permission
                </button>
              </form>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  return layout(isNew ? 'Create Role' : 'Edit Role', content, 'roles');
}

