<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Route extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'bus_id',
        'departure_city',
        'arrival_city',
        'departure_time',
        'arrival_time',
        'price',
        'available_seats'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function bus()
    {
        return $this->belongsTo(Buses::class, 'bus_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
