<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemandeConge extends Model
{
    use HasFactory;

    protected $primaryKey = 'idDemande';
    protected $table = 'demande_conges';
    
    protected $fillable = [
        'dateDebut',
        'dateFin',
        'dateEnvoi',
        'motif',
        'idEmploye',
        'idType',
        'idStatut'
    ];

    protected $casts = [
        'dateDebut' => 'date',
        'dateFin' => 'date',
        'dateEnvoi' => 'datetime',
    ];

    // Relation avec le type de congé - CORRIGÉE
    public function typeConge()
    {
        return $this->belongsTo(TypeConge::class, 'idType', 'idType');
    }

    // Relation avec le statut - CORRIGÉE
    public function statut()
    {
        return $this->belongsTo(StatutDemande::class, 'idStatut', 'idStatut');
    }

    // Relation avec l'employé
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'idEmploye', 'matricule');
    }
}