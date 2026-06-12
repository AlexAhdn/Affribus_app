<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'ticket_id',
        'transaction_id',
        'amount',
        'commission_percent',
        'commission_amount',
        'method',
        'status',
    ];

    protected $casts = [
        'amount' => 'float',
        'commission_percent' => 'float',
        'commission_amount' => 'float',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
