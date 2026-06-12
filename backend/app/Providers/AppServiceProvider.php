<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('is-admin', function ($user) {
            return in_array($user->role, ['admin', 'super_admin'], true);
        });

        Gate::define('is-company', function ($user) {
            return $user->company_id !== null && in_array($user->role, ['admin', 'company', 'company_reservation'], true);
        });

        Gate::define('is-company-admin', function ($user) {
            return $user->company_id !== null && in_array($user->role, ['admin', 'company'], true);
        });

        Gate::define('is-company-reservation', function ($user) {
            return $user->company_id !== null && in_array($user->role, ['admin', 'company', 'company_reservation'], true);
        });
    }
}
