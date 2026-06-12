<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    public function run()
    {
        Company::firstOrCreate(
            ['email' => 'africatours@afribus.com'],
            ['name' => 'Africa Tours', 'phone' => '+229 0100000001', 'status' => 'active']
        );

        Company::firstOrCreate(
            ['email' => 'expressvoyage@afribus.com'],
            ['name' => 'Express Voyage', 'phone' => '+229 0100000002', 'status' => 'active']
        );

        Company::firstOrCreate(
            ['email' => 'beninexpress@afribus.com'],
            ['name' => 'Benin Express', 'phone' => '+229 0100000003', 'status' => 'active']
        );
    }
}
