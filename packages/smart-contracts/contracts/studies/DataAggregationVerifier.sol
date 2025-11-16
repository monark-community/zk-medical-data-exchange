// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20947677048627408399933474539297998569958870279985155152457381396585779410294;
    uint256 constant alphay  = 4387913589145802684008904511694914431274201938348567800254677044445757914445;
    uint256 constant betax1  = 4982894177717685876725338047354224484672826932433204819199015470141368649116;
    uint256 constant betax2  = 19711894137952499822904899975157057228093896116594077375172896250637096674919;
    uint256 constant betay1  = 3034140872160221160832169033174822978234773477036901966096037635940269522664;
    uint256 constant betay2  = 17795722943918127989796024518128768527957238785008522299879724938155533066878;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 4886632533789763807890041558755598734065525411938275041279152463205067641374;
    uint256 constant deltax2 = 7133270742547027797973056837943373528374817635906391343370444942870705815401;
    uint256 constant deltay1 = 1336137374962737327798291290833326204920642194727705871610850155809783801295;
    uint256 constant deltay2 = 13887944172810061897224356260726863944554786452356281311939047023083072923805;

    
    uint256 constant IC0x = 4785599762893352578964718582333271553010203777692077942556966070231915041207;
    uint256 constant IC0y = 7161110054406120396728889776221645245004196073696251983285592389313016066898;
    
    uint256 constant IC1x = 18668493064629856058037916191309929175220150705655156024003226180190699460376;
    uint256 constant IC1y = 2764843489163714846436451940950807720032699790467407060336691775250543186575;
    
    uint256 constant IC2x = 8731187574455657920910109574938832413701779723264621488867850282239741483498;
    uint256 constant IC2y = 479008658909960989626551996550235772944720955355797516687495220240474388521;
    
    uint256 constant IC3x = 13549366797628630505023816954311196423359884952215065605215854078622035057934;
    uint256 constant IC3y = 14948681572779610705375287438644944653832516362264957945767059105082313862333;
    
    uint256 constant IC4x = 15793700950753708808412560666564695996019345496409179649620528356341408908108;
    uint256 constant IC4y = 21648873547937140268898767996645391583882076294491224278800511212023618560868;
    
    uint256 constant IC5x = 4631360970466037463922085743608536579557725923015305681028613031470454557214;
    uint256 constant IC5y = 7008993849579021954297788403060026911232233435365699872928310015991498261880;
    
    uint256 constant IC6x = 14501902696378583629045790565803650142201120973647607484292105032869492849279;
    uint256 constant IC6y = 535700377283109057049913628671009952610045151227286375018529704966512105208;
    
    uint256 constant IC7x = 4788114802363208815770837589711121954696283906909942963018093910010453218201;
    uint256 constant IC7y = 21464910755551905380101913482888357764087388807136942097809715125549658819086;
    
    uint256 constant IC8x = 3834600040852132562881119173579853567882208446905386158631037588703603549617;
    uint256 constant IC8y = 16110681133198912193333806837195901257019718437857795014560692052296952754172;
    
    uint256 constant IC9x = 5905354311474600224001771169462465661521439731617674095298295642478047613227;
    uint256 constant IC9y = 11063793500357826987767605866625222898573627067455158988767313853849233151315;
    
    uint256 constant IC10x = 3522053615194756600636397204379728360489756812386718265545768891096448109291;
    uint256 constant IC10y = 6216273997034299700365806398423079835310056620675572170348580012318831783784;
    
    uint256 constant IC11x = 16520092570508368642819725874933325925342928960766863690613807731713493698322;
    uint256 constant IC11y = 13654314911580287646858095498059777823120395302617938070681074188952148283930;
    
    uint256 constant IC12x = 18551648395261435124521925429044613732402465188693732991633837596719116070747;
    uint256 constant IC12y = 20228207028457528906584092303896360273785501073734123316970928728035172871380;
    
    uint256 constant IC13x = 326499631492366224256147323699870552958852009266864590675373649864704147401;
    uint256 constant IC13y = 12123269781213541769285400746908194384775628172169425187490942916662404523765;
    
    uint256 constant IC14x = 6984997722389136501442431101401226049811985128052854645355057439455315377201;
    uint256 constant IC14y = 172510145584254260257396251510780623143572869585920982716948630621906543950;
    
    uint256 constant IC15x = 92271505323685052509021199136663693934482148281813841574575228765605801601;
    uint256 constant IC15y = 4209031471544480775188628568488162631813867037126981331792687020747439389122;
    
    uint256 constant IC16x = 21255707611596699692782848038641105709664870713945559430983205867457577308177;
    uint256 constant IC16y = 16835278484129218419022684413001975708674909377132470921842192336105815537528;
    
    uint256 constant IC17x = 4293741065444126382955386464260573864536830728145799195740074707577694984704;
    uint256 constant IC17y = 13105405857914350979046818711655414282457747695784070314555617355412003349585;
    
    uint256 constant IC18x = 15433433048144329297739575914599847841684981016834592715632177127482685679820;
    uint256 constant IC18y = 15044193957261380238951809413102312193817057874860050727125578906975385851229;
    
    uint256 constant IC19x = 287474257860859026648816344763574037336192594433168898509940451351877422509;
    uint256 constant IC19y = 17150815311735027143485555195819418161382157994935959515387490507324088987959;
    
    uint256 constant IC20x = 17247982420537568486452829261533011508668076249853681190509321773032980204628;
    uint256 constant IC20y = 11228626398609373960959085769706849866790530664703150884828227043604955011640;
    
    uint256 constant IC21x = 9309772820015983852072154842163321817106132246849437485930132256636438410412;
    uint256 constant IC21y = 14763622055743590349574929649492507956614195200618137286101580307155510755335;
    
    uint256 constant IC22x = 20466918806153682304347981243192750743099641578244248216553923328669688076136;
    uint256 constant IC22y = 18702439619530797086045040909870246819606082250727401873773427184326709917729;
    
    uint256 constant IC23x = 18785954846983045097357230044322444992899622228717996695723356274380289222941;
    uint256 constant IC23y = 8536734151078807073485514106780971085188570347556726704446999420275562246192;
    
    uint256 constant IC24x = 4627602827311434394077463944272729705005163410755270813918749678558627999299;
    uint256 constant IC24y = 15514088362362593200046577612119945382484509341867595684592718329932320412917;
    
    uint256 constant IC25x = 332298537688621068119802787069483648527547142779122425829081727502436972744;
    uint256 constant IC25y = 12397219533849716469133087174057464507462302346260787467506781804135535192220;
    
    uint256 constant IC26x = 4227700893928171580164633746028848196018716778922760734439113191368961674071;
    uint256 constant IC26y = 11402047957360079897119829091233351630698825361877618698652922752408387443035;
    
    uint256 constant IC27x = 859232532038464052761778646237373250046283704060775504900784057658390751079;
    uint256 constant IC27y = 11614966177212077539311988913999467009302457501852304677991286055458663188142;
    
    uint256 constant IC28x = 10535051322427453219461167047466211526593033358558410262452769354459404499172;
    uint256 constant IC28y = 9891318313591170490983471604199063211829919959397773174348887327901629722260;
    
    uint256 constant IC29x = 17867010896879886646610335709242975185598818570751102106328698201161219824864;
    uint256 constant IC29y = 3399938182661038284624724088461986547150787523385863524368934182193968138791;
    
    uint256 constant IC30x = 15744113839471508905905293964424435740739420039102973072907154915574046535745;
    uint256 constant IC30y = 2091777884708278749357465484024653843659876352419125345688106858668716783020;
    
    uint256 constant IC31x = 15882513643817073773739230059553605776485167650324130982559966542553837837273;
    uint256 constant IC31y = 12322616332266385282961058420321894550797591921936852678461945092131191672749;
    
    uint256 constant IC32x = 11364616622810432994569324824409605988349335239886972963937399609166104708321;
    uint256 constant IC32y = 13315429404550791758262651191807482209429207240026483841444528810393749462072;
    
    uint256 constant IC33x = 441059326944186313758000948926990512275227215996788236445782754269783716099;
    uint256 constant IC33y = 1467762734315255505708597270474136467960708265108192541086202330310911161950;
    
    uint256 constant IC34x = 3839313704358923127034737480780462466098043534608868023570916409066014810119;
    uint256 constant IC34y = 4726813351011768733745575748447596095769808961612172125993815000662840910687;
    
    uint256 constant IC35x = 1173173965559280161053445069108027099016873134619740575228013870050938045806;
    uint256 constant IC35y = 10662541642338838438244005882568230851038048361707320221880764919729927571788;
    
    uint256 constant IC36x = 19808808167284281495327466183955850997526688883168496482854378333872374876393;
    uint256 constant IC36y = 6499195225888088416167906074229906820719551710850289731494415449483288841070;
    
    uint256 constant IC37x = 17628801453504898159872675685269959050163464625075013192444895947847889596700;
    uint256 constant IC37y = 12569985060654255673582291740333722410824542490534474828865222098656145916167;
    
    uint256 constant IC38x = 16524644536219043520363599350794159189923193384770156521537081695689965521929;
    uint256 constant IC38y = 8907473917414718307093411734120258797927050816626106462365033107353607152566;
    
    uint256 constant IC39x = 10061932811555415585206360661713875340231704186519624339924470329288998798818;
    uint256 constant IC39y = 9644083703226623094221795754681152453844061523127627460431369722417591417404;
    
    uint256 constant IC40x = 2842255461756323220471101491291973218555925377493279817415382867879104159756;
    uint256 constant IC40y = 9813218038205779175965375319604637481760520842722628514253398460346074057389;
    
    uint256 constant IC41x = 21008733885042292938730921961450420562226980901315893652052094587102825510644;
    uint256 constant IC41y = 5595356702587769024451349501819892638300015299822770510988726674299208771259;
    
    uint256 constant IC42x = 11188527607709275278912119423014627549371449212516213023775809458924311604431;
    uint256 constant IC42y = 21391509191488202139073794027786513422358585049104389143929118444724758084463;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[42] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
