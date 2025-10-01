<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employe extends Model
{
    use HasFactory;

    protected $primaryKey = 'matricule';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $table = 'employes';

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'sexe',
        'fonction',
        'soldeConge',
        'dateEmbauche',
        'idStructure',
        'superieur_id'
    ];

    protected $casts = [
        'dateEmbauche' => 'date',
    ];

    // Relation avec la structure
    public function structure()
    {
        return $this->belongsTo(Structure::class, 'idStructure');
    }

    // Relation avec le supérieur
    public function superieur()
    {
        return $this->belongsTo(Employe::class, 'superieur_id', 'matricule');
    }

    // Relation avec les subordonnés
    public function subordonnes()
    {
        return $this->hasMany(Employe::class, 'superieur_id', 'matricule');
    }

    // Relation avec les demandes de congé
    public function demandesConges()
    {
        return $this->hasMany(DemandeConge::class, 'idEmploye', 'matricule');
    }

    // Relation avec l'utilisateur
    public function user()
    {
        return $this->hasOne(User::class, 'matricule_employe', 'matricule');
    }
}