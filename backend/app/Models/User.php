<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'idUtilisateur';
    
    protected $table = 'users';

    protected $fillable = [
        'email',
        'motDePasse',
        'role',
        'matricule_employe'
    ];

    protected $hidden = [
        'motDePasse',
        'remember_token',
    ];

    public function getAuthPassword()
    {
        return $this->motDePasse;
    }

    // Relation avec l'employé
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'matricule_employe', 'matricule');
    }

    // Relation avec l'historique
    public function historiques()
    {
        return $this->hasMany(Historique::class, 'idUtilisateur');
    }
}