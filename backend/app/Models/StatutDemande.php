<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatutDemande extends Model
{
    use HasFactory;

    protected $primaryKey = 'idStatut';
    
    protected $table = 'statut_demandes';

    protected $fillable = [
        'libelle'
    ];

    // Relation avec les demandes de congé
    public function demandesConges()
    {
        return $this->hasMany(DemandeConge::class, 'idStatut');
    }
}