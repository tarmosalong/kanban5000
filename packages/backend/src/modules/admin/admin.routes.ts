import { Router } from 'express';
import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';
import { requireAdminAuth, adminLogin, adminLogout } from './admin.middleware.js';
import { loginPage } from './views/layout.js';
import { dashboardPage, usersPage, editUserPage } from './views/pages.js';

/**
 * Create admin routes.
 */
export function createAdminRoutes(db: Kysely<Database>): Router {
  const router = Router();

  // Login page
  router.get('/login', (req, res) => {
    res.send(loginPage());
  });

  // Login action
  router.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (adminLogin(password, res)) {
      res.redirect('/admin');
    } else {
      res.send(loginPage('Invalid password'));
    }
  });

  // Logout
  router.get('/logout', (req, res) => {
    adminLogout(res);
    res.redirect('/admin/login');
  });

  // Protected routes
  router.use(requireAdminAuth());

  // Dashboard
  router.get('/', async (req, res) => {
    try {
      // Get stats
      const [usersCount, workspacesCount, projectsCount, issuesCount, recentUsers] = await Promise.all([
        db.selectFrom('users').select(({ fn }) => fn.count('id').as('count')).executeTakeFirst(),
        db.selectFrom('workspaces').select(({ fn }) => fn.count('id').as('count')).executeTakeFirst(),
        db.selectFrom('projects').select(({ fn }) => fn.count('id').as('count')).executeTakeFirst(),
        db.selectFrom('issues').select(({ fn }) => fn.count('id').as('count')).executeTakeFirst(),
        db.selectFrom('users').selectAll().orderBy('created_at', 'desc').limit(5).execute(),
      ]);

      const stats = {
        totalUsers: Number(usersCount?.count ?? 0),
        totalWorkspaces: Number(workspacesCount?.count ?? 0),
        totalProjects: Number(projectsCount?.count ?? 0),
        totalIssues: Number(issuesCount?.count ?? 0),
        recentUsers: recentUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          roles: typeof u.roles === 'string' ? JSON.parse(u.roles) : (u.roles || []),
          createdAt: u.created_at,
        })),
      };

      res.send(dashboardPage(stats));
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Users list
  router.get('/users', async (req, res) => {
    try {
      const message = req.query.message as string | undefined;
      const messageType = req.query.type as 'success' | 'error' | undefined;

      const users = await db
        .selectFrom('users')
        .selectAll()
        .orderBy('created_at', 'desc')
        .execute();

      res.send(usersPage(
        users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          roles: typeof u.roles === 'string' ? JSON.parse(u.roles) : (u.roles || []),
          createdAt: u.created_at,
        })),
        message && messageType ? { type: messageType, text: message } : undefined
      ));
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Edit user page
  router.get('/users/:id/edit', async (req, res) => {
    try {
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', req.params.id)
        .executeTakeFirst();

      if (!user) {
        return res.redirect('/admin/users?message=User not found&type=error');
      }

      res.send(editUserPage({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []),
        createdAt: user.created_at,
      }));
    } catch (error) {
      console.error('Admin edit user error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Update user
  router.post('/users/:id/edit', async (req, res) => {
    try {
      const { email, name, roles } = req.body;
      
      // Normalize roles to array
      const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);

      await db
        .updateTable('users')
        .set({
          email,
          name: name || null,
          roles: JSON.stringify(rolesArray),
        })
        .where('id', '=', req.params.id)
        .execute();

      res.redirect('/admin/users?message=User updated successfully&type=success');
    } catch (error) {
      console.error('Admin update user error:', error);
      
      const user = await db.selectFrom('users').selectAll().where('id', '=', req.params.id).executeTakeFirst();
      if (user) {
        res.send(editUserPage({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []),
          createdAt: user.created_at,
        }, { type: 'error', text: 'Failed to update user' }));
      } else {
        res.redirect('/admin/users?message=Failed to update user&type=error');
      }
    }
  });

  // Delete user
  router.post('/users/:id/delete', async (req, res) => {
    try {
      await db.deleteFrom('users').where('id', '=', req.params.id).execute();
      res.redirect('/admin/users?message=User deleted successfully&type=success');
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.redirect('/admin/users?message=Failed to delete user&type=error');
    }
  });

  // Workspaces (placeholder)
  router.get('/workspaces', async (req, res) => {
    res.send(dashboardPage({ totalUsers: 0, totalWorkspaces: 0, totalProjects: 0, totalIssues: 0, recentUsers: [] }));
  });

  // Stats (placeholder)
  router.get('/stats', async (req, res) => {
    res.send(dashboardPage({ totalUsers: 0, totalWorkspaces: 0, totalProjects: 0, totalIssues: 0, recentUsers: [] }));
  });

  return router;
}

