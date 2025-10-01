<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Structure extends Model
{
    use HasFactory;

    protected $primaryKey = 'idStructure';
    
    protected $table = 'structures';

    protected $fillable = [
        'nom',
        'type'
    ];

    // Relation avec les employés
    public function employes()
    {
        return $this->hasMany(Employe::class, 'idStructure');
    }
}