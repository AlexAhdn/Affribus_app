<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cities = [
            'Cotonou',
            'Porto-Novo',
            'Parakou',
            'Dassa',
            'Bohicon',
            'Abomey',
            'Natitingou',
            'Lokossa',
            'Ouidah',
            'Kandi',
        ];

        foreach ($cities as $city) {
            City::firstOrCreate(['name' => $city]);
        }
    }
}
