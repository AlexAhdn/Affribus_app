<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'ticket_id',
        'type',
        'title',
        'message',
        'route_label',
        'travel_date',
        'read_at',
    ];

    protected $casts = [
        'travel_date' => 'date:Y-m-d',
        'read_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
