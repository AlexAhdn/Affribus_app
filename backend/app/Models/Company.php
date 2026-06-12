<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Company extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'phone', 'address', 'status', 'logo', 'user_id', 'commission_percent'];

    public function routes()
    {
        return $this->hasMany(Route::class);
    }

    public function buses()
    {
        return $this->hasMany(Buses::class, 'company_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(CompanyNotification::class);
    }
}
