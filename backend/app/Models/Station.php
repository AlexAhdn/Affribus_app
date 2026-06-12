<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Station extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'city',
        'address',
        'latitude',
        'longitude',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
