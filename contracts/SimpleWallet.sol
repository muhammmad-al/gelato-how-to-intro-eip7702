// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract SimpleWallet {
    uint256 public nonce;
    
    event Executed(address indexed target, uint256 value, bytes data);
    event BatchExecuted(uint256 indexed nonce, uint256 count);
    
    // Simple execute function
    function execute(address target, uint256 value, bytes calldata data) external payable {
        nonce++;
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");
        emit Executed(target, value, data);
    }
    
    // Batch execute multiple calls
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external payable {
        require(targets.length == values.length && values.length == datas.length, "Length mismatch");
        
        uint256 currentNonce = ++nonce;
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success,) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Batch execution failed");
            emit Executed(targets[i], values[i], datas[i]);
        }
        emit BatchExecuted(currentNonce, targets.length);
    }
    
    // Simple function to demonstrate smart wallet capabilities
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow receiving ETH
    receive() external payable {}
    fallback() external payable {}
}