<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'route_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'seats',
        'passenger_names',
        'travel_date',
        'transaction_id',
        'status',
        'boarding_station',
        'boarding_station_id',
        'amount',
        'validated_at',
        'validated_by',
        'validation_status',
        'is_used',
    ];

    protected $casts = [
        'seats' => 'array',
        'passenger_names' => 'array',
        'travel_date' => 'date:Y-m-d',
        'validated_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    protected $appends = [
        'numero_unique',
    ];

    public function getNumeroUniqueAttribute(): ?string
    {
        $companyName = $this->route?->company?->name;

        if (!$companyName || !$this->transaction_id) {
            return null;
        }

        return "{$companyName}-{$this->transaction_id}";
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function boardingStation()
    {
        return $this->belongsTo(Station::class, 'boarding_station_id');
    }
}
