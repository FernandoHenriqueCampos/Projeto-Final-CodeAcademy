<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $demoUsers = [
            [
                'name' => 'Demo User',
                'username' => 'demo',
                'email' => 'demo@instaclone.test',
                'bio' => 'Conta demo para explorar o InstaClone.',
            ],
            [
                'name' => 'Ana Martins',
                'username' => 'ana.martins',
                'email' => 'ana@instaclone.test',
                'bio' => 'Cafe, fotografia e pequenas viagens.',
            ],
            [
                'name' => 'Bruno Costa',
                'username' => 'bruno.costa',
                'email' => 'bruno@instaclone.test',
                'bio' => 'Registrando bastidores de projetos e treinos.',
            ],
            [
                'name' => 'Carla Souza',
                'username' => 'carla.souza',
                'email' => 'carla@instaclone.test',
                'bio' => 'Design, plantas e boas conversas.',
            ],
            [
                'name' => 'Diego Lima',
                'username' => 'diego.lima',
                'email' => 'diego@instaclone.test',
                'bio' => 'Cidade, musica e fotografia de rua.',
            ],
        ];

        $extraUsers = [
            ['name' => 'Eduarda Rocha', 'username' => 'duda.rocha', 'email' => 'duda@instaclone.test', 'bio' => 'Arquitetura, livros e fotos de domingo.'],
            ['name' => 'Felipe Ramos', 'username' => 'felipe.ramos', 'email' => 'felipe@instaclone.test', 'bio' => 'Tecnologia, basquete e receitas simples.'],
            ['name' => 'Gabi Nunes', 'username' => 'gabi.nunes', 'email' => 'gabi@instaclone.test', 'bio' => 'Moda, cores e achados pela cidade.'],
            ['name' => 'Henrique Alves', 'username' => 'rique.alves', 'email' => 'rique@instaclone.test', 'bio' => 'Corrida, musica e um pouco de codigo.'],
            ['name' => 'Isabela Prado', 'username' => 'isa.prado', 'email' => 'isa@instaclone.test', 'bio' => 'Fotografando comida bonita e lugares calmos.'],
            ['name' => 'Joao Mendes', 'username' => 'joao.mendes', 'email' => 'joao@instaclone.test', 'bio' => 'Cinema, rua e cronicas curtas.'],
            ['name' => 'Lara Teixeira', 'username' => 'lara.teixeira', 'email' => 'lara@instaclone.test', 'bio' => 'UX, ilustracao e cafe gelado.'],
            ['name' => 'Mateus Barros', 'username' => 'mateus.barros', 'email' => 'mateus@instaclone.test', 'bio' => 'Viagens pequenas e bons mapas.'],
            ['name' => 'Nina Castro', 'username' => 'nina.castro', 'email' => 'nina@instaclone.test', 'bio' => 'Plantas, trilhas e fotografia analogica.'],
            ['name' => 'Otavio Reis', 'username' => 'otavio.reis', 'email' => 'otavio@instaclone.test', 'bio' => 'Guitarra, design e noites produtivas.'],
            ['name' => 'Paula Freitas', 'username' => 'paula.freitas', 'email' => 'paula@instaclone.test', 'bio' => 'Receitas, familia e mesa posta.'],
            ['name' => 'Rafael Dias', 'username' => 'rafael.dias', 'email' => 'rafael@instaclone.test', 'bio' => 'Skate, cidade e fotografia urbana.'],
        ];

        $users = [...$demoUsers, ...$extraUsers];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    ...$user,
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                ],
            );
        }
    }
}
