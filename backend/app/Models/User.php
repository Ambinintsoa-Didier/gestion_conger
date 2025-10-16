<?php
// app/Models/User.php

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
        'matricule_employe',
        'password_temp', // Nouveau champ
        'must_change_password' // Nouveau champ
    ];

    protected $hidden = [
        'motDePasse',
        'remember_token',
        'password_temp' // Caché par défaut
    ];

    protected $casts = [
        'must_change_password' => 'boolean',
        'email_verified_at' => 'datetime',
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

    // Méthode pour rendre le mot de passe temporaire visible
    public function makePasswordTempVisible()
    {
        $this->makeVisible(['password_temp']);
        return $this;
    }

    // Vérifier si l'utilisateur doit changer son mot de passe
    public function needsPasswordChange()
    {
        return $this->must_change_password;
    }
}