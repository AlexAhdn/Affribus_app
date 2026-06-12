<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Buses extends Model
{
    use HasFactory;

    protected $table = 'buses';

    protected $fillable = [
        'company_id',
        'name',
        'registration_number',
        'seat_count',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function seats()
    {
        return $this->hasMany(Seat::class, 'bus_id');
    }

    public function routes()
    {
        return $this->hasMany(Route::class, 'bus_id');
    }
}
