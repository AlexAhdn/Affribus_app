<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationFeeTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'min_price',
        'max_price',
        'fee',
        'position',
        'active',
    ];

    protected $casts = [
        'min_price' => 'float',
        'max_price' => 'float',
        'fee' => 'float',
        'active' => 'boolean',
    ];

    public static function feeForPrice(float $price): float
    {
        $tier = static::query()
            ->where('active', true)
            ->where('min_price', '<=', $price)
            ->where(function ($query) use ($price) {
                $query->whereNull('max_price')
                    ->orWhere('max_price', '>=', $price);
            })
            ->orderBy('position')
            ->first();

        return (float) ($tier?->fee ?? 0);
    }
}
