<?php


use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

public function boot(): void
{
    Gate::define('is-admin', function ($user) {
        return $user->role === 'admin';
    });

    Gate::define('is-company', function ($user) {
        return $user->role === 'company';
    });
}
}