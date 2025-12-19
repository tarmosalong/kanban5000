import { Router } from 'express';
import type { Kysely } from 'kysely';

import type { Database } from '../../infra/db/types.js';
import { requireAdminAuth, adminLogin, adminLogout } from './admin.middleware.js';
import { loginPage } from './views/layout.js';
import { dashboardPage, usersPage, editUserPage, rolesPage, editRolePage } from './views/pages.js';

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
        db.selectFrom('users')
          .selectAll()
          .orderBy('created_at', 'desc')
          .limit(5)
          .execute(),
      ]);

      // Fetch roles for recent users
      const userRoles = recentUsers.length > 0 
        ? await db
            .selectFrom('user_roles')
            .innerJoin('roles', 'roles.id', 'user_roles.role_id')
            .select(['user_roles.user_id', 'roles.name'])
            .where('user_roles.user_id', 'in', recentUsers.map(u => u.id))
            .execute()
        : [];

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
          roles: userRoles.filter(ur => ur.user_id === u.id).map(ur => ur.name),
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

      // Fetch roles for all users
      const userRoles = users.length > 0
        ? await db
            .selectFrom('user_roles')
            .innerJoin('roles', 'roles.id', 'user_roles.role_id')
            .select(['user_roles.user_id', 'roles.name'])
            .where('user_roles.user_id', 'in', users.map(u => u.id))
            .execute()
        : [];

      res.send(usersPage(
        users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          roles: userRoles.filter(ur => ur.user_id === u.id).map(ur => ur.name),
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
      const [user, userRoles, allRoles] = await Promise.all([
        db.selectFrom('users').selectAll().where('id', '=', req.params.id).executeTakeFirst(),
        db.selectFrom('user_roles')
          .innerJoin('roles', 'roles.id', 'user_roles.role_id')
          .select(['roles.id', 'roles.name'])
          .where('user_roles.user_id', '=', req.params.id)
          .execute(),
        db.selectFrom('roles').selectAll().execute(),
      ]);

      if (!user) {
        return res.redirect('/admin/users?message=User not found&type=error');
      }

      res.send(editUserPage({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: userRoles.map(r => r.name),
        createdAt: user.created_at,
      }, undefined, allRoles.map(r => ({ id: r.id, name: r.name }))));
    } catch (error) {
      console.error('Admin edit user error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Update user
  router.post('/users/:id/edit', async (req, res) => {
    try {
      const { email, name, roles } = req.body;
      const roleIds = Array.isArray(roles) ? roles : (roles ? [roles] : []);

      await db.transaction().execute(async (trx) => {
        // Update user basic info
        await trx
          .updateTable('users')
          .set({
            email,
            name: name || null,
            updated_at: new Date(),
          })
          .where('id', '=', req.params.id)
          .execute();

        // Update roles
        // First delete all existing roles
        await trx
          .deleteFrom('user_roles')
          .where('user_id', '=', req.params.id)
          .execute();

        // Then insert new roles
        if (roleIds.length > 0) {
          await trx
            .insertInto('user_roles')
            .values(roleIds.map(roleId => ({
              user_id: req.params.id,
              role_id: roleId,
            })))
            .execute();
        }
      });

      res.redirect('/admin/users?message=User updated successfully&type=success');
    } catch (error) {
      console.error('Admin update user error:', error);
      res.redirect(`/admin/users/${req.params.id}/edit?message=Failed to update user&type=error`);
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

  // Roles list
  router.get('/roles', async (req, res) => {
    try {
      const message = req.query.message as string | undefined;
      const messageType = req.query.type as 'success' | 'error' | undefined;

      const roles = await db
        .selectFrom('roles')
        .leftJoin('user_roles', 'user_roles.role_id', 'roles.id')
        .select([
          'roles.id',
          'roles.name',
          'roles.description',
          (eb) => eb.fn.count('user_roles.user_id').as('userCount')
        ])
        .groupBy(['roles.id', 'roles.name', 'roles.description'])
        .orderBy('roles.name', 'asc')
        .execute();

      res.send(rolesPage(
        roles.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          userCount: Number(r.userCount)
        })),
        message && messageType ? { type: messageType, text: message } : undefined
      ));
    } catch (error) {
      console.error('Admin roles error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // New role page
  router.get('/roles/new', (req, res) => {
    res.send(editRolePage());
  });

  // Create role
  router.post('/roles/new', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      await db
        .insertInto('roles')
        .values({
          name,
          description: description || null,
        })
        .execute();

      res.redirect('/admin/roles?message=Role created successfully&type=success');
    } catch (error) {
      console.error('Admin create role error:', error);
      res.send(editRolePage(undefined, { type: 'error', text: 'Failed to create role. Name might be taken.' }));
    }
  });

  // Edit role page
  router.get('/roles/:id/edit', async (req, res) => {
    try {
      const [role, permissions] = await Promise.all([
        db.selectFrom('roles').selectAll().where('id', '=', req.params.id).executeTakeFirst(),
        db.selectFrom('permissions').selectAll().where('role_id', '=', req.params.id).execute(),
      ]);

      if (!role) {
        return res.redirect('/admin/roles?message=Role not found&type=error');
      }

      res.send(editRolePage({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: permissions.map(p => ({
          id: p.id,
          action: p.action,
          resource: p.resource,
          scope: p.scope,
        })),
      }));
    } catch (error) {
      console.error('Admin edit role error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Add permission to role
  router.post('/roles/:id/permissions/add', async (req, res) => {
    try {
      const { action, resource, scope } = req.body;
      
      await db
        .insertInto('permissions')
        .values({
          role_id: req.params.id,
          action,
          resource,
          scope: scope || null,
        })
        .execute();

      res.redirect(`/admin/roles/${req.params.id}/edit?message=Permission added&type=success`);
    } catch (error) {
      console.error('Admin add permission error:', error);
      res.redirect(`/admin/roles/${req.params.id}/edit?message=Failed to add permission&type=error`);
    }
  });

  // Delete permission from role
  router.post('/roles/:roleId/permissions/:permissionId/delete', async (req, res) => {
    try {
      await db
        .deleteFrom('permissions')
        .where('id', '=', req.params.permissionId)
        .where('role_id', '=', req.params.roleId)
        .execute();

      res.redirect(`/admin/roles/${req.params.roleId}/edit?message=Permission removed&type=success`);
    } catch (error) {
      console.error('Admin delete permission error:', error);
      res.redirect(`/admin/roles/${req.params.roleId}/edit?message=Failed to remove permission&type=error`);
    }
  });

  // Update role
  router.post('/roles/:id/edit', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      const role = await db.selectFrom('roles').selectAll().where('id', '=', req.params.id).executeTakeFirst();
      if (!role) return res.redirect('/admin/roles?message=Role not found&type=error');

      await db
        .updateTable('roles')
        .set({
          // Don't allow renaming admin role
          ...(role.name !== 'admin' && { name }),
          description: description || null,
        })
        .where('id', '=', req.params.id)
        .execute();

      res.redirect('/admin/roles?message=Role updated successfully&type=success');
    } catch (error) {
      console.error('Admin update role error:', error);
      res.redirect(`/admin/roles/${req.params.id}/edit?message=Failed to update role&type=error`);
    }
  });

  // Delete role
  router.post('/roles/:id/delete', async (req, res) => {
    try {
      const role = await db.selectFrom('roles').selectAll().where('id', '=', req.params.id).executeTakeFirst();
      if (!role) return res.redirect('/admin/roles?message=Role not found&type=error');
      if (role.name === 'admin') return res.redirect('/admin/roles?message=Cannot delete admin role&type=error');

      await db.deleteFrom('roles').where('id', '=', req.params.id).execute();
      res.redirect('/admin/roles?message=Role deleted successfully&type=success');
    } catch (error) {
      console.error('Admin delete role error:', error);
      res.redirect('/admin/roles?message=Failed to delete role&type=error');
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

