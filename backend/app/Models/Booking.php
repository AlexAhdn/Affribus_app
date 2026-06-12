<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'route_id',
        'travel_date',
        'seats',
        'first_name',
        'last_name',
        'email',
        'status',
        'expires_at'
    ];

    protected $casts = [
        'seats' => 'array',
        'travel_date' => 'date',
        'expires_at' => 'datetime'
    ];

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}