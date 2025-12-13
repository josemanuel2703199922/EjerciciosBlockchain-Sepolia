// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MiContrato {
    string private nombre;
    uint256 private cambios;
    // MAX_HISTORIAL sigue siendo 100
    uint256 constant MAX_HISTORIAL = 100;
    string[] private historial;

    // El test espera 3 argumentos: nuevoNombre, address, timestamp
    event NombreCambiado(string nuevoNombre, address cambiador, uint256 timestamp);

    constructor() {
        nombre = "Nombre Inicial";
        cambios = 0;
        // OPTIMIZACIÓN DE GAS 1: Inicialización del array a tamaño fijo.
        historial = new string[](MAX_HISTORIAL);
    }

    // Getter para nombre
    function obtenerNombre() public view returns (string memory) {
        return nombre;
    }

    // Getter para contador de cambios
    function obtenerCambios() public view returns (uint256) {
        return cambios;
    }

    // Getter para historial completo
    // Devuelve un array de 100 elementos, con cadenas vacías en los slots no usados.
    function obtenerHistorial() public view returns (string[] memory) {
        return historial;
    }

    // Getter para tamaño del historial (reporta el tamaño lógico, no físico)
    function historialSize() public view returns (uint256) {
        if (cambios < MAX_HISTORIAL) {
            return cambios; 
        }
        return MAX_HISTORIAL; 
    }

    // Función para cambiar nombre (Optimización de Gas 2)
    function cambiarNombre(string memory nuevoNombre) public {
        require(bytes(nuevoNombre).length > 0, "Nombre no puede estar vacio");

        nombre = nuevoNombre;
        cambios++;

        // Lógica de Buffer Circular optimizada y eficiente (asignación directa).
        uint256 index = (cambios - 1) % MAX_HISTORIAL;
        historial[index] = nuevoNombre;
        
        emit NombreCambiado(nuevoNombre, msg.sender, block.timestamp);
    }
}