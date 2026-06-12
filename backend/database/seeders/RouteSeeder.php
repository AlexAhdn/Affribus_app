<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Buses;
use App\Models\Route;
use App\Models\Company;

class RouteSeeder extends Seeder
{
    public function run()
    {
        $this->call(CompanySeeder::class);

        $companies = Company::orderBy('id')->get();

        if ($companies->count() < 3) {
            return;
        }

        $busA = Buses::firstOrCreate(
            ['registration_number' => 'BJ-AB-1001'],
            ['company_id' => $companies[0]->id, 'name' => 'Bus VIP 1', 'seat_count' => 50]
        );

        $busB = Buses::firstOrCreate(
            ['registration_number' => 'BJ-AB-1002'],
            ['company_id' => $companies[1]->id, 'name' => 'Express 1', 'seat_count' => 40]
        );

        $busC = Buses::firstOrCreate(
            ['registration_number' => 'BJ-AB-1003'],
            ['company_id' => $companies[2]->id, 'name' => 'Benin Star', 'seat_count' => 45]
        );

        Route::firstOrCreate([
            'company_id' => $companies[0]->id,
            'departure_city' => 'Cotonou',
            'arrival_city' => 'Parakou',
            'departure_time' => '08:00:00',
        ], [
            'bus_id' => $busA->id,
            'arrival_time' => '14:00:00',
            'price' => 7000,
            'available_seats' => 50
        ]);

        Route::firstOrCreate([
            'company_id' => $companies[1]->id,
            'departure_city' => 'Cotonou',
            'arrival_city' => 'Parakou',
            'departure_time' => '10:00:00',
        ], [
            'bus_id' => $busB->id,
            'arrival_time' => '16:00:00',
            'price' => 8000,
            'available_seats' => 40
        ]);

        Route::firstOrCreate([
            'company_id' => $companies[1]->id,
            'departure_city' => 'Parakou',
            'arrival_city' => 'Cotonou',
            'departure_time' => '07:00:00',
        ], [
            'bus_id' => $busB->id,
            'arrival_time' => '13:00:00',
            'price' => 8000,
            'available_seats' => 40
        ]);

        Route::firstOrCreate([
            'company_id' => $companies[2]->id,
            'departure_city' => 'Cotonou',
            'arrival_city' => 'Dassa',
            'departure_time' => '09:00:00',
        ], [
            'bus_id' => $busC->id,
            'arrival_time' => '15:00:00',
            'price' => 7500,
            'available_seats' => 45
        ]);

        Route::firstOrCreate([
            'company_id' => $companies[2]->id,
            'departure_city' => 'Porto-Novo',
            'arrival_city' => 'Cotonou',
            'departure_time' => '11:00:00',
        ], [
            'bus_id' => $busC->id,
            'arrival_time' => '12:30:00',
            'price' => 2500,
            'available_seats' => 45
        ]);

        Route::firstOrCreate([
            'company_id' => $companies[0]->id,
            'departure_city' => 'Cotonou',
            'arrival_city' => 'Porto-Novo',
            'departure_time' => '12:00:00',
        ], [
            'bus_id' => $busA->id,
            'arrival_time' => '13:30:00',
            'price' => 2500,
            'available_seats' => 50
        ]);
    }
}
