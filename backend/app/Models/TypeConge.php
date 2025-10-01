<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeConge extends Model
{
    use HasFactory;

    protected $primaryKey = 'idType';
    
    protected $table = 'type_conges';

    protected $fillable = [
        'nom',
        'nombreJour'
    ];

    // Relation avec les demandes de congé
    public function demandesConges()
    {
        return $this->hasMany(DemandeConge::class, 'idType');
    }
}