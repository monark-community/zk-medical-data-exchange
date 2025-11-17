// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Disperse - batch sender for ETH and ERC20
/// @notice Send ETH or ERC20 to many recipients in a single transaction.
/// @dev For ERC20, the caller must approve this contract for at least the summed amount before calling.

interface IERC20 {
  function balanceOf(address account) external view returns (uint256);
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
}

abstract contract ReentrancyGuard {
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;
  uint256 private _status = _NOT_ENTERED;

  modifier nonReentrant() {
    require(_status != _ENTERED, "REENTRANCY");
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
  }
}

contract Disperse is ReentrancyGuard {
  /// ----------------- ///
  ///       EVENTS      ///
  /// ----------------- ///
  event DisperseETH(address indexed sender, uint256 count, uint256 total);
  event DisperseToken(address indexed token, address indexed sender, uint256 count, uint256 total);
  event RescueToken(address indexed token, address indexed to, uint256 amount);
  event RescueETH(address indexed to, uint256 amount);

  /// ----------------- ///
  ///      ERRORS       ///
  /// ----------------- ///
  error LengthMismatch();
  error ZeroAddress();
  error ValueMismatch(); // msg.value != sum(amounts)
  error TransferFailed();
  error EmptyArray();
  error InsufficientAllowance();
  error InsufficientAmount();

  /// ----------------- ///
  ///    ETH DISPERSE   ///
  /// ----------------- ///

  /// @notice Send variable ETH amounts to many recipients. msg.value must equal sum(amounts).
  function disperseETH(address[] calldata recipients, uint256[] calldata amounts)
    external
    payable
    nonReentrant
  {
    uint256 len = recipients.length;
    if (len == 0) revert EmptyArray();
    if (len != amounts.length) revert LengthMismatch();

    uint256 total = 0;
    unchecked {
      for (uint256 i = 0; i < len; ++i) {
        total += amounts[i];
      }
    }
    if (msg.value != total) revert ValueMismatch();

    for (uint256 i = 0; i < len; ++i) {
      address to = recipients[i];
      if (to == address(0)) revert ZeroAddress();
      uint256 amt = amounts[i];
      if (amt == 0) continue; // allow zeros
      (bool ok, ) = to.call{value: amt}("");
      if (!ok) revert TransferFailed();
    }

    emit DisperseETH(msg.sender, len, total);
  }

  /// @notice Send the same ETH amount to all recipients. msg.value must equal amount * recipients.length.
  function disperseETHEqual(address[] calldata recipients, uint256 amountEach)
    external
    payable
    nonReentrant
  {
    uint256 len = recipients.length;
    if (len == 0) revert EmptyArray();
    if (amountEach == 0) revert InsufficientAmount();
    uint256 total = amountEach * len;
    if (msg.value != total) revert ValueMismatch();

    for (uint256 i = 0; i < len; ++i) {
      address to = recipients[i];
      if (to == address(0)) revert ZeroAddress();
      (bool ok, ) = to.call{value: amountEach}("");
      if (!ok) revert TransferFailed();
    }

    emit DisperseETH(msg.sender, len, total);
  }

  /// ----------------- ///
  ///   ERC20 DISPERSE  ///
  /// ----------------- ///

  /// @notice Send variable ERC20 amounts to many recipients in a single call (pulls from msg.sender).
  ///         The caller must have approved this contract for at least the sum of amounts.
  function disperseToken(
    IERC20 token,
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external nonReentrant {
    uint256 len = recipients.length;
    if (len == 0) revert EmptyArray();
    if (len != amounts.length) revert LengthMismatch();

    uint256 total = 0;
    unchecked {
      for (uint256 i = 0; i < len; ++i) {
        total += amounts[i];
      }
    }
    if (total == 0) revert InsufficientAmount();
    if (token.allowance(msg.sender, address(this)) < total) revert InsufficientAllowance();

    // Pull once per recipient (keeps per-recipient event logs visible on token)
    for (uint256 i = 0; i < len; ++i) {
      address to = recipients[i];
      if (to == address(0)) revert ZeroAddress();
      uint256 amt = amounts[i];
      if (amt == 0) continue;
      bool ok = token.transferFrom(msg.sender, to, amt);
      if (!ok) revert TransferFailed();
    }

    emit DisperseToken(address(token), msg.sender, len, total);
  }

  /// @notice Send the same ERC20 amount to all recipients (pulls from msg.sender).
  function disperseTokenEqual(
    IERC20 token,
    address[] calldata recipients,
    uint256 amountEach
  ) external nonReentrant {
    uint256 len = recipients.length;
    if (len == 0) revert EmptyArray();
    if (amountEach == 0) revert InsufficientAmount();
    uint256 total = amountEach * len;
    if (token.allowance(msg.sender, address(this)) < total) revert InsufficientAllowance();

    for (uint256 i = 0; i < len; ++i) {
      address to = recipients[i];
      if (to == address(0)) revert ZeroAddress();
      bool ok = token.transferFrom(msg.sender, to, amountEach);
      if (!ok) revert TransferFailed();
    }

    emit DisperseToken(address(token), msg.sender, len, total);
  }

  /// ----------------- ///
  ///     RESCUES       ///
  /// ----------------- ///

  /// @notice Rescue ERC20 mistakenly sent to this contract.
  function rescueToken(IERC20 token, address to, uint256 amount) external nonReentrant {
    if (to == address(0)) revert ZeroAddress();
    bool ok = token.transfer(to, amount);
    if (!ok) revert TransferFailed();
    emit RescueToken(address(token), to, amount);
  }

  /// @notice Rescue ETH mistakenly sent to this contract.
  function rescueETH(address payable to, uint256 amount) external nonReentrant {
    if (to == address(0)) revert ZeroAddress();
    (bool ok, ) = to.call{value: amount}("");
    if (!ok) revert TransferFailed();
    emit RescueETH(to, amount);
  }

  /// @dev Allow receiving ETH (e.g., via rescue or refunds).
  receive() external payable {}
}
