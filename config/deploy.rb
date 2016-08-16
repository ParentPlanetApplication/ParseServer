# config valid only for current version of Capistrano
lock '3.6.0'

set :application, 'ParseServer'
set :repo_url, 'git@github.com:ParentPlanetApplication/ParseServer.git'
set :deploy_to, '/home/deployer/apps/parse/server'
set :branch, "capistrano"
set :ssh_options, { :forward_agent => true }

# set :npm_target_path, -> { release_path.join('subdir') } # default not set
set :npm_flags, '--silent --no-progress'    # default
set :npm_roles, :all                                     # default
set :npm_env_variables, {}                               # default

# set :pm2_config, 'config/pm2.json'

namespace :deploy do

  desc 'Restart application'
  task :restart do
    # invoke 'pm2:restart'
    desc "Start server"
    on roles(:app) do
      within release_path do
        execute "echo Restarting your service now."
        execute "cd #{release_path} && APP_NAME=\"#{fetch :application}\" npm run pm2"
        execute "echo Deployer Successfully deployed this Application"
      end
    end
  end

  after :publishing, :restart
end
